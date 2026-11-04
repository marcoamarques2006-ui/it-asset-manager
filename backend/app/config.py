"""
Configuração central da aplicação.

Único ponto de leitura de variáveis de ambiente — nenhum outro módulo
deve chamar os.environ diretamente. Isso mantém o acoplamento com o
ambiente de execução concentrado em um único lugar.
"""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_debug: bool = True
    secret_key: str = "change-me"
    # Versão SemVer da imagem; vem do build (ARG APP_VERSION no Dockerfile).
    app_version: str = "dev"

    database_url: str


@lru_cache
def get_settings() -> Settings:
    """Cacheado: evita reler/reparsear variáveis de ambiente a cada request."""
    return Settings()
