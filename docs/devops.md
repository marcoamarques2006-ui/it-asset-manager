# Containers, CD, segredos, versionamento e rollback

Este documento mostra onde está cada entrega de DevOps e como ela
funciona. Os links de execução real (pipelines, releases, imagens) ficam
em [Evidências](#evidências).

| Entrega | Onde está |
|---|---|
| Dockerfile otimizado | [`backend/Dockerfile`](../backend/Dockerfile), [`backend/.dockerignore`](../backend/.dockerignore) |
| Orquestração (Docker Compose) | [`docker-compose.yml`](../docker-compose.yml) (dev) e [`deploy/docker-compose.yml`](../deploy/docker-compose.yml) (homologação/produção) |
| Pipeline de CD (registry + deploy) | [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml), [`deploy-ambiente.yml`](../.github/workflows/deploy-ambiente.yml), [`deploy/deploy.sh`](../deploy/deploy.sh) |
| Segredos | GitHub Actions secrets (repositório e environments), [`.env.example`](../.env.example) sem nenhuma senha |
| Versionamento e rollback | [`scripts/next-version.sh`](../scripts/next-version.sh), [`rollback.yml`](../.github/workflows/rollback.yml), rollback automático em [`deploy/deploy.sh`](../deploy/deploy.sh) |

## Visão geral do fluxo

```
PR (título em Conventional Commits)
  └─ CI obrigatório: testes do backend + build da imagem de produção + frontend
       └─ merge (squash) na main
            └─ Deploy (deploy.yml)
                 ├─ Frontend → Vercel           (produção real do app)
                 ├─ Migrations → Supabase       (produção real do app)
                 └─ API em container:
                      versao ─► imagem ─► homologacao ─► producao
                      (SemVer)  (GHCR +    (smoke test,   (smoke test,
                                release)   rollback auto) rollback auto)
```

A API (FastAPI + Postgres) é a parte do projeto que roda em container.
O frontend continua indo para a Vercel e o banco de produção do app é o
Supabase. Os ambientes de **homologação** e **produção** da API são
**simulados** no runner do GitHub Actions (detalhes em
[Ambientes simulados](#ambientes-simulados)).

## 1. Dockerfile otimizado

[`backend/Dockerfile`](../backend/Dockerfile) é multi-stage:

| Estágio | Para quê |
|---|---|
| `builder` | cria um venv em `/opt/venv` só com as dependências de runtime |
| `dev` | `builder` + dependências de teste (pytest, httpx). Usado pelo compose de dev e pelo CI |
| `runtime` | **imagem publicada**: só o venv e o código, sem compilador, sem cache do pip, sem libs de teste, sem a pasta de testes |

O que torna a imagem final otimizada:

- **Sem toolchain de build:** o Dockerfile antigo instalava `gcc` e
  `libpq-dev` via apt. Eles não eram necessários, porque `psycopg[binary]`
  já traz a libpq embutida.
- **Camadas em cache:** `requirements.txt` é copiado e instalado antes do
  código, então mudar código não reinstala dependências. No CI, o cache
  de camadas fica no GitHub Actions (`cache-from/to: type=gha`).
- **Dependências separadas:** [`requirements.txt`](../backend/requirements.txt)
  (runtime) e [`requirements-dev.txt`](../backend/requirements-dev.txt)
  (testes).
- **Contexto enxuto:** o [`.dockerignore`](../backend/.dockerignore) tira
  `.env`, caches e venvs locais do build, então nenhum segredo local entra
  na imagem.
- **Sem root:** roda como o usuário `app` (uid 10001), e o código pertence
  ao root (só leitura para o processo).
- **`HEALTHCHECK`:** chama `/health`, que também testa a conexão com o
  banco.
- **Rastreável:** a versão entra como `ARG APP_VERSION`, aparece no label
  OCI `org.opencontainers.image.version` e no `/health`. O commit fica em
  `org.opencontainers.image.revision`.

Medido localmente (`docker image ls`):

| | Tamanho |
|---|---|
| Dockerfile anterior (estágio único, com gcc) | 700 MB |
| Estágio `runtime` atual | 305 MB |

```bash
docker build -t itam-api ./backend          # gera o estágio runtime (último)
docker build --target dev -t itam-api:dev ./backend
```

## 2. Orquestração com Docker Compose

São dois arquivos, porque são dois usos diferentes:

**[`docker-compose.yml`](../docker-compose.yml): desenvolvimento.**
Faz o build do código local (estágio `dev`), com hot reload e bind mounts.
Sobe `db` (Postgres 16) → `migrate` (aplica as migrations do Alembic e
sai) → `api` (com healthcheck) → `frontend` (dev server). A `api` só sobe
depois que o banco está *healthy* e o `migrate` terminou com sucesso.

```bash
cp .env.example .env   # preencha POSTGRES_PASSWORD (obrigatória; o compose recusa subir sem)
make up
```

**[`deploy/docker-compose.yml`](../deploy/docker-compose.yml): homologação e produção.**
Não faz build nem monta nada do disco: roda **só a imagem versionada do
GHCR** (`${IMAGE}:${APP_VERSION}`), ou seja, exatamente o artefato que
passou pelo pipeline. O banco não publica porta (só é acessível pela rede
interna do compose), e as credenciais vêm de variáveis de ambiente.

## 3. Pipeline de CD

Arquivo: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
Roda a cada push na `main` (ou seja, a cada PR mesclado, que já passou
pelos checks obrigatórios do CI). Há um deploy por vez (`concurrency`).

| Job | O que faz |
|---|---|
| `API - calcula versao` | calcula a próxima versão SemVer (ver [seção 5](#5-versionamento-semântico)) |
| `API - imagem no GHCR + release` | build do estágio `runtime`, push para `ghcr.io/marcoamarques2006-ui/it-asset-manager-api` com as tags `X.Y.Z`, `X.Y`, `sha-<commit>` e `latest`. Depois cria a tag git `vX.Y.Z` e o GitHub Release com as notas geradas a partir dos PRs |
| `API - homologacao` | deploy no environment `homologacao` + smoke test |
| `API - producao` | só roda se homologação passou. Deploy no environment `producao` + smoke test |

Homologação e produção usam o mesmo workflow reutilizável,
[`deploy-ambiente.yml`](../.github/workflows/deploy-ambiente.yml), que
chama [`deploy/deploy.sh`](../deploy/deploy.sh):

1. Lê no registry qual versão o ambiente roda hoje, pela tag móvel
   `:homologacao` / `:producao`.
2. Sobe essa versão atual e grava um dado de controle no banco.
3. Faz o upgrade para a versão nova: `migrate` roda as migrations e a `api`
   é recriada.
4. **Smoke test:** `/health` responde 200 com a versão nova (o que prova
   que o banco está acessível), `POST` e `GET /api/v1/devices` funcionam,
   e o dado de controle continua lá.
5. **Passou:** a tag do ambiente passa a apontar para a versão nova.
   **Falhou:** rollback automático (ver [seção 6](#6-rollback)).

### Ambientes simulados

O runner do GitHub Actions é efêmero, então cada deploy reconstrói o
ambiente. Primeiro sobe a versão que estava em produção, depois faz o
upgrade sobre um banco com dados. Assim, o upgrade e o rollback acontecem
de verdade, com containers e banco reais. O que persiste entre execuções
é o **estado no registry**: a tag `:producao` diz qual versão está em
produção, e a `:homologacao`, qual está em homologação. Cada environment
tem seus próprios secrets e aparece no histórico de *Deployments* do
repositório.

## 4. Gestão de segredos

Nenhuma senha ou token está no código-fonte. A tabela mostra onde cada
credencial fica e quem a usa:

| Credencial | Onde fica | Quem usa |
|---|---|---|
| Login no GHCR | `GITHUB_TOKEN` efêmero, gerado a cada job (`permissions: packages: write`) | jobs `imagem` e de deploy |
| `POSTGRES_PASSWORD`, `SECRET_KEY` | **secrets de environment**: valores diferentes em `homologacao` e `producao`, visíveis só para jobs daquele environment | `deploy-ambiente.yml` → `deploy/deploy.sh` |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | secrets do repositório | `deploy-frontend` |
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | secrets do repositório | `deploy-supabase` |
| Senha do Postgres do CI | gerada com `openssl rand` a cada execução, nunca salva | `ci.yml` |
| Senha do Postgres de dev | `.env` local (no `.gitignore`), que cada dev preenche | `docker-compose.yml` |

Além disso:

- Os jobs de deploy declaram `environment:`, então só eles leem os
  secrets de `homologacao`/`producao`. O workflow reutilizável é chamado
  com `secrets: inherit`, que é a forma de esses secrets de environment
  chegarem até ele.
- O [`.env.example`](../.env.example) só tem nomes de variáveis, com
  `POSTGRES_PASSWORD` e `SECRET_KEY` vazias. Os dois composes usam
  `${VAR:?}` e se recusam a subir sem elas.
- Os secrets aparecem mascarados (`***`) nos logs do Actions.
- A *anon key* do Supabase em `frontend/src/lib/supabase.ts` é pública
  por design: é a chave que o navegador usa. O acesso aos dados é
  protegido por RLS, não pelo sigilo da chave.

Para listar (os valores nunca aparecem):

```bash
gh secret list
gh secret list --env homologacao
gh secret list --env producao
```

## 5. Versionamento semântico

A versão é calculada por [`scripts/next-version.sh`](../scripts/next-version.sh)
a partir da última tag `vX.Y.Z` e dos commits que entraram na `main`
desde ela. Como cada commit da `main` é o squash de um PR, e o título do
PR já é validado como Conventional Commits, **o título do PR decide a
versão**:

| Título do PR | Incremento | Exemplo |
|---|---|---|
| `feat!: ...` ou corpo com `BREAKING CHANGE:` | MAJOR | 1.4.2 → 2.0.0 |
| `feat: ...` | MINOR | 1.4.2 → 1.5.0 |
| `fix:`, `docs:`, `ci:`, `chore:`, ... | PATCH | 1.4.2 → 1.4.3 |

Cada versão gera:

- tag git `vX.Y.Z` + GitHub Release (com as notas geradas a partir dos PRs);
- imagem `ghcr.io/marcoamarques2006-ui/it-asset-manager-api:X.Y.Z`,
  imutável e nunca sobrescrita por outra versão, além de `X.Y`,
  `sha-<commit>` e `latest`;
- o `/health` da API responde `"version": "X.Y.Z"`.

Tags móveis por ambiente, `:homologacao` e `:producao`, apontam para a
versão que está em cada um. Elas só se movem depois que o smoke test
passa.

## 6. Rollback

### Automático (em caso de falha no deploy)

Está dentro de [`deploy/deploy.sh`](../deploy/deploy.sh). Se o smoke test
da versão nova falhar:

1. A `api` volta para a versão anterior. O banco e os dados ficam como
   estão, e as migrations não rodam de novo.
2. O script confere que `/health` responde 200 **na versão anterior** e que
   o dado gravado antes do upgrade continua no banco.
3. A tag do ambiente **não** é movida, ou seja, o registry continua dizendo
   que o ambiente está na versão anterior.
4. O job termina **vermelho**, com o resumo "deploy da vX falhou → rollback
   automático para vY". Se a falha for em homologação, produção nem chega
   a rodar.

### Manual

Workflow [`Rollback`](../.github/workflows/rollback.yml) (*Actions →
Rollback → Run workflow*), para quando um problema aparece depois de um
deploy que passou:

```bash
gh workflow run rollback.yml -f ambiente=producao -f versao=0.1.0
```

O workflow valida se a imagem `X.Y.Z` existe no GHCR. Depois reimplanta
essa versão **sem build novo** e sem rodar migrations (a versão antiga não
conhece migrations mais novas). O caminho é o mesmo do deploy normal, com
smoke test incluído. Se a versão de destino também não subir, o rollback
é desfeito.

> Limite assumido: o rollback volta a **aplicação**, não o **schema** do
> banco. Por isso, as migrations precisam ser compatíveis com a versão
> anterior (padrão *expand/contract*: adicionar coluna nova em uma versão
> e remover a antiga só numa versão seguinte).

### Como simular uma falha

1. Ligue a variável `SIMULAR_FALHA=true` no environment `producao`
   (*Settings → Environments → producao → Variables*, ou
   `gh variable set SIMULAR_FALHA --env producao --body true`).
2. Mescle qualquer PR. Homologação passa normalmente. Em produção, a
   versão nova sobe com [`deploy/falha-simulada.yml`](../deploy/falha-simulada.yml),
   que passa uma credencial de banco errada para a `api`, como num secret
   rotacionado incorretamente. O `/health` responde 503, o smoke test
   falha e o rollback automático devolve a versão anterior.
3. Desligue a variável (`gh variable delete SIMULAR_FALHA --env producao`)
   e reexecute o job de produção que falhou (*Re-run failed jobs*). Agora a
   versão nova sobe.

Para reproduzir sem GitHub, na máquina local (os mesmos cenários foram
testados assim):

```bash
docker build --build-arg APP_VERSION=0.1.0 -t itam-api-local:0.1.0 ./backend
docker build --build-arg APP_VERSION=0.1.1 -t itam-api-local:0.1.1 ./backend
export IMAGE=itam-api-local POSTGRES_PASSWORD=$(openssl rand -hex 16) SECRET_KEY=$(openssl rand -hex 16)
SIMULAR_FALHA=true bash deploy/deploy.sh teste 0.1.1 0.1.0   # sai 1: rollback para 0.1.0
APP_VERSION=x AMBIENTE=teste docker compose -p itam-teste -f deploy/docker-compose.yml down -v
```

## Evidências

Onde ver:

- Releases (uma por versão): <https://github.com/marcoamarques2006-ui/it-asset-manager/releases>
- Imagens no GHCR: <https://github.com/marcoamarques2006-ui/it-asset-manager/pkgs/container/it-asset-manager-api>
- Histórico de deploys por ambiente: <https://github.com/marcoamarques2006-ui/it-asset-manager/deployments>

| Versão | Execução | O que mostra |
|---|---|---|
| v0.1.0 | [Deploy #41757155403](https://github.com/marcoamarques2006-ui/it-asset-manager/actions/runs/41757155403) | Versão calculada (primeiro `feat`), imagem publicada e release criado. O deploy **parou em homologação** porque os secrets do environment não chegavam ao workflow reutilizável (`POSTGRES_PASSWORD` vazia), e produção nem rodou. Isso foi corrigido no #17 |
| v0.1.1 | [Deploy #41759647813](https://github.com/marcoamarques2006-ui/it-asset-manager/actions/runs/41759647813) | Fluxo completo: `fix` → PATCH, imagem `0.1.1` no GHCR, homologação OK, **produção OK** (`/health` → `"version":"0.1.1"`), tags `:homologacao` e `:producao` movidas |

A simulação de rollback (falha injetada em produção) está registrada na
seção seguinte.
