# Contribuindo

Este documento define como o trabalho flui neste repositório: estratégia de
ramificação, convenção de commits e regras da branch principal.

## Estratégia de ramificação: Trunk-Based Development

- `main` é o único branch de longa duração e está sempre "deployable".
- Todo trabalho novo nasce em um branch curto criado a partir de `main`:

  ```
  git checkout main
  git pull
  git checkout -b feat/nome-curto-da-mudanca
  ```

- Branches vivem pouco tempo (idealmente < 2 dias). Mudanças grandes são
  quebradas em fatias pequenas e integradas com frequência, em vez de um
  branch de feature acumulando semanas de trabalho.
- Sem branches de release/develop paralelos. Se algo incompleto precisar
  chegar em `main` antes de estar pronto para uso, esconda atrás de uma
  flag/config em vez de manter um branch vivo por muito tempo.
- Integração via **Pull Request**, sempre. Depois do merge, o branch é
  apagado (o repositório já está configurado para apagar automaticamente).

### Convenção de nomes de branch

| Prefixo    | Uso                                       |
|------------|--------------------------------------------|
| `feat/`    | nova funcionalidade                        |
| `fix/`     | correção de bug                            |
| `chore/`   | manutenção, dependências, configuração     |
| `docs/`    | documentação                               |
| `refactor/`| refatoração sem mudança de comportamento   |
| `test/`    | testes                                     |
| `ci/`      | pipelines/automação                        |

## Convenção de commits: Conventional Commits

Todo commit (e todo título de Pull Request, que vira o commit de squash em
`main`) segue [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo opcional>): <descrição no imperativo, minúscula, sem ponto final>
```

Tipos aceitos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`.

Exemplos:

```
feat(devices): adiciona filtro por status na listagem
fix(devices): impede update de serial_number duplicado
docs: documenta estratégia de branching no CONTRIBUTING
chore(deps): atualiza fastapi para 0.115
```

Mudança que quebra compatibilidade: acrescente `!` depois do tipo/escopo
(`feat(api)!: remove campo legado do payload`) e explique o breaking
change no corpo do commit.

O formato do **título do PR** é validado automaticamente
(`.github/workflows/pr-title-lint.yml`) — PRs fora do padrão não passam no
check obrigatório.

## Pull Requests

- PR pequeno, focado em uma coisa só. Facilita revisão e mantém o
  histórico de `main` legível.
- Merge é sempre **squash** (única opção habilitada no repositório) — o
  título do PR vira a mensagem do commit em `main`, por isso ele precisa
  seguir Conventional Commits. Isso mantém o histórico de `main` linear e
  padronizado, um commit por mudança lógica.
- Antes de abrir o PR, rode os testes localmente (`make test` no backend).

## Regras da branch `main`

Configuradas via ruleset do GitHub, aplicam-se a todo mundo, inclusive
administradores:

- Push direto bloqueado — toda mudança entra por Pull Request.
- Histórico linear obrigatório (sem merge commits — squash/rebase apenas).
- Force-push e exclusão do branch bloqueados.
- Conversas abertas no PR precisam ser resolvidas antes do merge.
- Check `Semantic Pull Request` (título no padrão Conventional Commits)
  precisa passar antes do merge.
