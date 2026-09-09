# IT Asset Manager

Base "crua" de gerenciamento de equipamentos de TI — controle de estoque
com CRUD de devices, pensado para expandir depois em direção a
inventário automático, health check, agente e conceitos de AD/Intune,
sem exigir reescrita da fundação.

## Frontend

`frontend/` é o projeto "Servia ITSM", importado do Lovable
(TanStack Start + React 19 + Tailwind v4 + shadcn/ui). Está aqui como
**referência visual**, não como algo já integrado ao backend:

- Só a rota `/` (Dashboard) tem conteúdo real, e é 100% dado mockado
  (hardcoded no componente) — sem chamada de API nenhuma.
- Todas as outras rotas (`ativos`, `softwares`, `chamados`, `catalogo`,
  `automacoes`, `alertas`, `aprovacoes`, `historico`, `relatorios`,
  `vulnerabilidades`) são `PlaceholderPage` vazias — a navegação já
  existe, o conteúdo não.
- O escopo visual sugerido (SLA, chamados, vulnerabilidades,
  aprovações) é **maior** que o escopo atual do backend (só
  `devices`). Isso é esperado: a decisão do time foi manter essas
  telas como inspiração de design e ir integrando/removendo conforme
  o projeto evolui, sem se comprometer a implementar tudo agora.

Quando for integrar uma tela real (ex.: `ativos.tsx`) ao backend:
1. Trocar o conteúdo mockado por uma chamada via `@tanstack/react-query`
   ao endpoint correspondente em `backend/app/modules/<módulo>/router.py`.
2. Ajustar os tipos TypeScript para bater com o `schemas.py` do módulo.
3. Só então decidir se mantém, adapta ou remove a tela.

## Migração para Supabase (em andamento)

O projeto está migrando do backend FastAPI+Postgres+Docker (abaixo)
para uma arquitetura serverless: Supabase (Postgres gerenciado + Auth +
PostgREST + Realtime) com deploy do frontend na Vercel. **Essa migração
ainda não está completa** — o FastAPI continua existindo e coberto
pelo CI até a troca ser validada em todas as telas.

Estado atual:
- `supabase/migrations/` — porta 1:1 do schema (`devices`,
  `installed_software`, `maintenance_logs`) que já existia no
  FastAPI/Alembic, mais `profiles` (companion de `auth.users`) e RLS
  habilitado em tudo. Aplicado no projeto remoto, sem drift
  (`supabase db diff --linked` → "No schema changes found").
- **A tela Ativos (`/ativos`) já fala com o Supabase**, não mais com o
  FastAPI — `frontend/src/lib/api.ts` usa `supabase-js`
  (`@/lib/supabase.ts`) em vez de `fetch`. As outras telas
  (`PlaceholderPage`) continuam como estavam.
- **Login obrigatório em todo o app** (`frontend/src/routes/login.tsx`
  + `frontend/src/lib/{auth,route-guard}.tsx`) — sem cadastro público;
  contas são criadas manualmente no painel do Supabase
  (Authentication → Users) ou via API administrativa
  (`/auth/v1/admin/users` com a `service_role` key).
- Validado ponta a ponta via API: usuário autenticado consegue
  criar/editar/listar devices; anônimo continua bloqueado pelo RLS
  (`[]`); serial duplicado retorna `23505`, mapeado no frontend pra
  mensagem amigável.

Pra usar o CLI (`supabase/` já está linkado ao projeto remoto):

```bash
npm install                          # instala o Supabase CLI (devDependency na raiz)
npx supabase login                   # ou --token / SUPABASE_ACCESS_TOKEN
npx supabase db push                 # aplica migrations pendentes
```

Variáveis do frontend (`frontend/.env.example`): `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` já vêm com o valor real do projeto como
default no código (`frontend/src/lib/supabase.ts`) — só precisa de
`.env` se for apontar pra outro projeto Supabase.

Próximas fases (ainda não implementadas): Edge Functions para lógica
de negócio custom, migrar as demais telas, Agent Windows que reporta
inventário/heartbeat, observabilidade externa (Prometheus/Grafana num
Proxmox separado, monitorando o Supabase e os endpoints públicos de
fora — não um servidor próprio), e por fim decomissionar o
FastAPI/Docker.

## Deploy

Produção: **https://it-asset-manager-rose.vercel.app**

A cada push na `main` (ou seja, a cada PR mesclado — já passou pelos
checks obrigatórios de `ci.yml` antes disso), `.github/workflows/deploy.yml`
publica automaticamente:
- **Frontend** → Vercel, via `vercel build` + `vercel deploy
  --prebuilt --prod` (não a integração nativa Vercel↔GitHub — foi
  desconectada de propósito, pra deploy só acontecer depois dos testes
  passarem, não a cada push solto).
- **Supabase** → `supabase db push` aplica migrations pendentes no
  projeto remoto.

Projeto Vercel: `it-asset-manager` (root directory = `frontend/`,
preset de build `nitro: { preset: "vercel" }` em
`frontend/vite.config.ts` — o default da lib
`@lovable.dev/vite-tanstack-config` é Cloudflare, precisa desse
override pra gerar o output certo pra Vercel).

Secrets do GitHub Actions necessários (`gh secret list`):
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`.

Deploy manual (sem esperar o CI), a partir de `frontend/`:

```bash
npx vercel pull --yes --environment=production --token=<VERCEL_TOKEN>
npx vercel build --prod --token=<VERCEL_TOKEN>
npx vercel deploy --prebuilt --prod --token=<VERCEL_TOKEN>
```

## Como rodar

```bash
cp .env.example .env
make up          # build + sobe api (porta 8000) + postgres (porta 5432)
make migrate     # aplica as migrations (primeira vez e a cada nova revision)
```

API disponível em `http://localhost:8000`. Docs automáticas (Swagger)
em `http://localhost:8000/docs`. Frontend disponível em
`http://localhost:3000`.

**Antes de rodar `make migrate`**, os endpoints que tocam o banco
(ex.: `GET /api/v1/devices`) retornam 500 — as tabelas ainda não
existem. Isso é esperado, não é bug.

Na primeira vez que sobe (`make up`), o container do frontend roda
`bun install` sozinho antes de subir o dev server — leva alguns
minutos e não tem progresso visível na tela por um tempo. Não
interrompa; é `docker compose logs -f frontend` pra acompanhar se
quiser confirmar que está avançando.

Rodar os testes do backend:

```bash
make test
```

Rodar os testes do frontend (Vitest + Testing Library):

```bash
docker compose exec frontend bun run test
```

Testes de frontend ficam em `frontend/src/test/` (ou colocados perto
do componente, fora de `src/routes/`). O roteador do TanStack Start
escaneia todo `.tsx` dentro de `routes/` como candidato a rota — um
`*.test.tsx` ali dispara um warning no dev server.

Criar uma nova migration depois de alterar um modelo:

```bash
make revision msg="descrição da mudança"
make migrate
```

## Arquitetura

```
backend/app/
├── main.py            # monta a app, registra routers e error handlers
├── config.py           # única fonte de variáveis de ambiente
├── database.py          # engine/sessão/Base do SQLAlchemy — única fonte
├── core/
│   ├── exceptions.py    # erros de domínio, agnósticos de HTTP
│   └── types.py         # tipos de coluna compartilhados (ex: GUID)
├── modules/
│   ├── devices/          # módulo de referência, totalmente implementado
│   │   ├── models.py      # ORM — só este arquivo conhece a tabela
│   │   ├── schemas.py      # contratos de entrada/saída da API (Pydantic)
│   │   ├── repository.py   # única camada que fala SQL/ORM
│   │   ├── service.py      # regras de negócio
│   │   └── router.py       # endpoints HTTP — sem lógica de negócio
│   ├── software/          # esqueleto (só model) — siga o padrão de devices
│   └── maintenance/       # esqueleto (só model) — siga o padrão de devices
└── tests/
    └── modules/devices/    # testes do módulo de referência
```

### Por que essa estrutura

- **Modularidade / baixo acoplamento** — cada domínio (`devices`,
  `software`, `maintenance`) é uma pasta autocontida com seu próprio
  model, schema, repository, service e router. Um módulo nunca importa
  o ORM de outro diretamente; se precisar, deve chamar o `service`
  correspondente. Adicionar um módulo novo (ex.: `policies`, `users`,
  depois de vocês incorporarem AD/Intune) não exige tocar nos
  existentes.

- **Camadas com responsabilidade única** dentro de cada módulo:
  `router` (HTTP) → `service` (regra de negócio) → `repository`
  (persistência) → `model` (schema do banco). Isso é o que permite
  testar regra de negócio sem subir servidor HTTP, e trocar de banco
  sem reescrever regra de negócio.

- **Idempotência** — endpoints seguem semântica HTTP correta: `PATCH`
  atualiza só os campos enviados, `DELETE` de um recurso já deletado
  retorna 404 de forma previsível (não quebra), `PUT`/criação com
  `serial_number` duplicado é rejeitado explicitamente em vez de gerar
  estado inconsistente.

- **Atomicidade** — cada operação de escrita no repository é uma
  transação única (`commit` no final do método, não espalhado). Os
  testes rodam cada um em uma transação isolada que é desfeita ao
  final, então nunca há vazamento de estado entre testes.

- **Config centralizada** — `config.py` é o único lugar que lê
  variáveis de ambiente; `database.py` é o único lugar que cria a
  engine. Isso evita que detalhes de infraestrutura vazem para dentro
  dos módulos de domínio.

- **GUID portátil** (`core/types.py`) — os `id`s usam UUID nativo em
  produção (Postgres) mas o mesmo model roda em SQLite nos testes, sem
  precisar de um banco real para testar regra de negócio.

### Como adicionar o módulo `software` ou `maintenance` por completo

Os models já existem. Falta, para cada um, copiar o padrão de
`devices/`:

1. `schemas.py` — `XCreate`, `XUpdate`, `XRead`.
2. `repository.py` — `list_all`, `get_by_id`, `create`, `update`, `delete`.
3. `service.py` — regras específicas (ex.: não permitir instalar o
   mesmo software duas vezes no mesmo device).
4. `router.py` — endpoints, registrados em `main.py`.

### Próximos passos sugeridos (fora do escopo atual)

- Frontend (dashboard) consumindo esta API.
- Autenticação/RBAC.
- Windows Agent reportando inventário automaticamente (populando
  `installed_software` sem digitação manual).
- Health check periódico.
- Policies / Compliance / Desired State (conceitos de Intune).
- Users/Groups (conceitos de AD).

## Contribuindo

Estratégia de branching (Trunk-Based), convenção de commits (Conventional
Commits) e regras da branch `main` estão descritas em
[CONTRIBUTING.md](CONTRIBUTING.md).
