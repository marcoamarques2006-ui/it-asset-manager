"""
Ponto de entrada da aplicação.

Responsabilidade: montar a app FastAPI, registrar routers e handlers
de exceção globais. Não deve conter regra de negócio nem acesso a
banco diretamente.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.devices.router import router as devices_router

app = FastAPI(title="IT Asset Manager", version="0.1.0")

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
def health_check():
    """Usado por Docker/monitoramento para saber se a API está de pé."""
    return {"status": "ok"}


app.include_router(devices_router, prefix="/api/v1")

# Ao criar os routers de software e maintenance, registre-os aqui:
# from app.modules.software.router import router as software_router
# from app.modules.maintenance.router import router as maintenance_router
# app.include_router(software_router, prefix="/api/v1")
# app.include_router(maintenance_router, prefix="/api/v1")
