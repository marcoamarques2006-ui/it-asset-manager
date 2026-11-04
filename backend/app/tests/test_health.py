"""
Testes do /health — é dele que dependem o HEALTHCHECK da imagem e o
smoke test do deploy (que decide entre seguir e fazer rollback).
"""
from sqlalchemy.exc import OperationalError

from app.database import get_db
from app.main import app


def test_health_ok_informa_banco_e_versao(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"
    assert "version" in body


def test_health_responde_503_quando_banco_cai(client):
    class SessaoQuebrada:
        def execute(self, *args, **kwargs):
            raise OperationalError("SELECT 1", {}, Exception("conexão recusada"))

    app.dependency_overrides[get_db] = lambda: SessaoQuebrada()

    response = client.get("/health")

    assert response.status_code == 503
    assert response.json()["database"] == "unreachable"
