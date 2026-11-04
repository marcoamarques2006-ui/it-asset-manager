# syntax=docker/dockerfile:1
#
# Imagem da API (FastAPI). Multi-stage:
#   builder  -> instala as dependências de runtime num venv isolado
#   dev      -> builder + dependências de teste; usado pelo docker-compose.yml
#               da raiz (hot reload) e pelo CI (make test)
#   runtime  -> imagem final publicada no registry: só o venv + o código,
#               sem pip cache, sem compilador, sem libs de teste, sem root
#
# "docker build ./backend" gera o runtime (último estágio).

ARG PYTHON_VERSION=3.12

FROM python:${PYTHON_VERSION}-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PATH="/opt/venv/bin:$PATH"
WORKDIR /app

# ---------------------------------------------------------------------------
FROM base AS builder
# psycopg[binary] já traz a libpq embutida: não precisa de gcc/libpq-dev.
RUN python -m venv /opt/venv
# Só os requirements primeiro: a camada de dependências fica em cache
# enquanto o código muda.
COPY requirements.txt .
RUN pip install -r requirements.txt

# ---------------------------------------------------------------------------
FROM builder AS dev
COPY requirements-dev.txt .
RUN pip install -r requirements-dev.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ---------------------------------------------------------------------------
FROM base AS runtime

ARG APP_VERSION=dev
ARG VCS_REF=unknown
LABEL org.opencontainers.image.title="it-asset-manager-api" \
      org.opencontainers.image.description="API do IT Asset Manager (FastAPI)" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${VCS_REF}"

# Usuário sem privilégios. O código fica com dono root (só leitura pro app).
RUN groupadd --system --gid 10001 app \
 && useradd --system --uid 10001 --gid app --no-create-home --shell /usr/sbin/nologin app

COPY --from=builder /opt/venv /opt/venv
COPY alembic.ini ./
COPY migrations ./migrations
COPY --exclude=tests app ./app

ENV APP_VERSION=${APP_VERSION}
USER app
EXPOSE 8000

# /health também testa a conexão com o banco (503 se cair).
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
