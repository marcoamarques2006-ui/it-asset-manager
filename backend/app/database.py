"""
Infraestrutura de acesso ao banco de dados.

Este módulo é a ÚNICA fonte da engine/sessão do SQLAlchemy. Módulos de
domínio (devices, software, maintenance) nunca criam engine própria —
apenas importam `Base` para declarar modelos e `get_db` para receber
uma sessão via injeção de dependência do FastAPI.
"""
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Classe base declarativa para todos os modelos ORM da aplicação."""
    pass


def get_db() -> Generator[Session, None, None]:
    """
    Dependency do FastAPI: entrega uma sessão por request e garante
    que ela seja sempre fechada (mesmo em caso de exceção).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
