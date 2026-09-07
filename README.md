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

## Como rodar

```bash
cp .env.example .env
make up          # build + sobe api (porta 8000) + postgres (porta 5432)
make migrate     # aplica as migrations (primeira vez e a cada nova revision)
```

API disponível em `http://localhost:8000`. Docs automáticas (Swagger)
em `http://localhost:8000/docs`. Frontend disponível em
`http://localhost:3000`.

Rodar os testes:

```bash
make test
```

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
