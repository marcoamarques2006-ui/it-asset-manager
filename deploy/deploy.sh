#!/usr/bin/env bash
# Deploy de uma versão da API num ambiente (homologacao | producao), com
# smoke test e ROLLBACK AUTOMÁTICO para a versão anterior se falhar.
#
# Uso: deploy/deploy.sh <ambiente> <versao-nova> [versao-anterior]
#
#   <versao-anterior> é a versão que o ambiente roda hoje (o pipeline lê da
#   tag :<ambiente> no registry). Vazia = primeiro deploy, sem rollback.
#
# Variáveis obrigatórias: IMAGE, POSTGRES_PASSWORD, SECRET_KEY
# Opcionais:
#   SIMULAR_FALHA=true  sobe a versão nova com deploy/falha-simulada.yml
#   SEM_MIGRACAO=true   troca só a api, sem rodar migrations (rollback manual
#                       para versão antiga, que não conhece migrations novas)
#   API_PORT            porta da api no host (default 8000)
#
# Códigos de saída: 0 = versão nova no ar | 1 = deploy falhou e o rollback
# deixou a versão anterior no ar | 2 = deploy falhou e não há versão
# anterior no ar (primeiro deploy ou rollback também falhou).
#
# O ambiente é simulado: no CI o runner é efêmero, então o script primeiro
# sobe a versão anterior (o "ambiente atual"), grava um dado e só então faz
# o upgrade — assim o upgrade e o rollback acontecem de verdade, sobre um
# banco com dados, e dá pra provar que o dado sobreviveu.
set -euo pipefail

AMBIENTE=${1:?uso: deploy.sh <ambiente> <versao-nova> [versao-anterior]}
NOVA=${2:?informe a versão nova}
ANTERIOR=${3:-}

: "${IMAGE:?defina IMAGE}" "${POSTGRES_PASSWORD:?defina POSTGRES_PASSWORD}" "${SECRET_KEY:?defina SECRET_KEY}"
export IMAGE POSTGRES_PASSWORD SECRET_KEY AMBIENTE
export API_PORT=${API_PORT:-8000}

DIR=$(cd "$(dirname "$0")" && pwd)
PROJETO="itam-$AMBIENTE"
URL="http://localhost:$API_PORT"
SERIAL_CONTROLE="CTRL-$AMBIENTE-$(date +%s)"

log() { echo "[$(date -u +%H:%M:%S)] $*"; }
resumo() { if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then echo "$*" >>"$GITHUB_STEP_SUMMARY"; fi; }

# compose <arquivos-extras...> -- <args do compose...>
compose() {
  local files=(-f "$DIR/docker-compose.yml")
  while [[ $# -gt 0 && "$1" != "--" ]]; do files+=(-f "$1"); shift; done
  shift
  docker compose -p "$PROJETO" "${files[@]}" "$@"
}

# Espera o /health responder 200 já na versão esperada.
aguarda_versao() {
  local esperada=$1 resp=""
  for _ in $(seq 1 30); do
    resp=$(curl -sS -w ' (HTTP %{http_code})' "$URL/health" 2>/dev/null || true)
    if [[ "$resp" == *"(HTTP 200)" && "$resp" == *"\"version\":\"$esperada\""* ]]; then
      log "health OK: $resp"
      return 0
    fi
    sleep 2
  done
  log "health não ficou OK na v$esperada em 60s (última resposta: ${resp:-sem resposta})"
  return 1
}

cria_device() {
  curl -fsS -X POST "$URL/api/v1/devices" \
    -H 'Content-Type: application/json' \
    -d "{\"hostname\":\"smoke-$1\",\"tipo\":\"servidor\",\"serial_number\":\"$1\"}" >/dev/null
}

device_existe() {
  curl -fsS "$URL/api/v1/devices" | grep -q "\"serial_number\":\"$1\""
}

# Smoke test: versão certa no /health (que também testa o banco) + escrita e
# leitura reais pela API + o dado gravado antes do upgrade continua lá.
smoke_test() {
  local versao=$1
  local serial="SMOKE-$versao-$RANDOM"
  aguarda_versao "$versao" || return 1
  cria_device "$serial" || { log "smoke: POST /api/v1/devices falhou"; return 1; }
  device_existe "$serial" || { log "smoke: device recém-criado não aparece na listagem"; return 1; }
  if [[ -n "$ANTERIOR" ]]; then
    device_existe "$SERIAL_CONTROLE" || { log "smoke: dado gravado antes do upgrade sumiu"; return 1; }
  fi
  log "smoke test OK na v$versao"
}

if [[ -n "$ANTERIOR" ]]; then
  log "== Ambiente atual: $AMBIENTE na v$ANTERIOR (simulado) =="
  export APP_VERSION=$ANTERIOR
  if ! compose -- up -d --quiet-pull || ! aguarda_versao "$ANTERIOR" || ! cria_device "$SERIAL_CONTROLE"; then
    log "a versão atual (v$ANTERIOR) nem sobe — abortando antes do upgrade"
    exit 2
  fi
  log "dado de controle gravado na v$ANTERIOR (serial $SERIAL_CONTROLE)"
fi

extras=()
if [[ "${SIMULAR_FALHA:-}" == "true" ]]; then
  extras=("$DIR/falha-simulada.yml")
  log "!! SIMULAR_FALHA=true: a v$NOVA vai subir com a falha de deploy/falha-simulada.yml"
fi

up_args=(up -d --quiet-pull)
if [[ "${SEM_MIGRACAO:-}" == "true" ]]; then
  up_args+=(--no-deps api)
  log "SEM_MIGRACAO=true: troca só a api, sem rodar migrations"
fi

log "== Deploy: $AMBIENTE -> v$NOVA =="
export APP_VERSION=$NOVA
if compose "${extras[@]}" -- "${up_args[@]}" && smoke_test "$NOVA"; then
  log "DEPLOY OK: $AMBIENTE está na v$NOVA"
  resumo "### ✅ $AMBIENTE: v$NOVA no ar"
  resumo ""
  resumo "Versão anterior: ${ANTERIOR:+v}${ANTERIOR:-nenhuma (primeiro deploy)}. Smoke test (health + banco + CRUD) passou."
  exit 0
fi

log "!! FALHA no deploy da v$NOVA em $AMBIENTE"
compose "${extras[@]}" -- logs --tail 10 api || true

if [[ -z "$ANTERIOR" ]]; then
  log "primeiro deploy deste ambiente: não há versão anterior para rollback"
  resumo "### ❌ $AMBIENTE: deploy da v$NOVA falhou (primeiro deploy, sem rollback possível)"
  exit 2
fi

log "== ROLLBACK: $AMBIENTE -> v$ANTERIOR =="
export APP_VERSION=$ANTERIOR
# Só a api volta: o banco (e os dados) ficam como estão, e as migrations não
# rodam de novo (a versão antiga não conhece migrations mais novas).
if compose -- up -d --no-deps api && aguarda_versao "$ANTERIOR" && device_existe "$SERIAL_CONTROLE"; then
  log "ROLLBACK OK: $AMBIENTE de volta na v$ANTERIOR, dado de controle preservado"
  resumo "### ⚠️ $AMBIENTE: deploy da v$NOVA falhou → rollback automático para v$ANTERIOR"
  resumo ""
  resumo "O smoke test da v$NOVA falhou. A api voltou para v$ANTERIOR, o /health respondeu OK e o dado gravado antes do upgrade continua no banco. A tag :$AMBIENTE no registry não foi movida."
  exit 1
fi

log "!! ROLLBACK FALHOU: $AMBIENTE fora do ar"
resumo "### ❌ $AMBIENTE: deploy da v$NOVA falhou e o rollback para v$ANTERIOR também falhou"
exit 2
