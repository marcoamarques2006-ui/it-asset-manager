"""
Exceções de domínio, agnósticas de HTTP.

Services levantam essas exceções; routers as traduzem para respostas
HTTP (ver register_exception_handlers em main.py). Isso mantém a
camada de serviço testável sem depender do FastAPI/Starlette.
"""


class DomainError(Exception):
    """Classe base para todos os erros de regra de negócio da aplicação."""


class NotFoundError(DomainError):
    """Levantado quando uma entidade solicitada não existe."""


class ConflictError(DomainError):
    """Levantado quando uma operação violaria uma regra de unicidade/estado."""
