"""
Ponto de entrada da aplicação.

Responsabilidade: montar a app FastAPI, registrar routers e handlers
de exceção globais. Não deve conter regra de negócio nem acesso a
banco diretamente.
"""
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.core.exceptions import ConflictError, NotFoundError
from app.database import get_db
from app.modules.devices.router import router as devices_router
from app.modules.software.router import router as software_router

settings = get_settings()

app = FastAPI(title="IT Asset Manager", version=settings.app_version)

# Libera o frontend de dev (Vite/TanStack Start em outra porta) a chamar a API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
def handle_not_found(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ConflictError)
def handle_conflict(request: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"detail": str(exc)})


@app.get("/health", tags=["system"])
def health_check(db: Session = Depends(get_db)):
    """
    Usado pelo HEALTHCHECK da imagem e pelo smoke test do deploy: responde
    200 só se a API alcança o banco, e informa a versão que está rodando
    (é assim que o pipeline confirma qual versão está no ar).
    """
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "unreachable", "version": settings.app_version},
        )
    return {"status": "ok", "database": "ok", "version": settings.app_version}


app.include_router(devices_router, prefix="/api/v1")
app.include_router(software_router, prefix="/api/v1")

# Ao criar o router de maintenance, registre-o aqui:
# from app.modules.maintenance.router import router as maintenance_router
# app.include_router(maintenance_router, prefix="/api/v1")
