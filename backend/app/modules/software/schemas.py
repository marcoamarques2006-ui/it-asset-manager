"""
Schemas Pydantic do módulo software.

Segue o mesmo raciocínio de `devices/schemas.py`: contrato de API
separado do modelo ORM.
"""
import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class SoftwareBase(BaseModel):
    device_id: uuid.UUID
    nome: str = Field(min_length=1, max_length=255)
    versao: str | None = None
    data_instalacao: date | None = None


class SoftwareCreate(SoftwareBase):
    """Payload para criação. Todos os campos obrigatórios de SoftwareBase."""


class SoftwareUpdate(BaseModel):
    """
    Payload para atualização parcial (PATCH).

    `device_id` não é atualizável — o vínculo de uma instalação com um
    device é definido na criação; para "mover" o software, remova e
    crie um novo registro no device correto.
    """
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    versao: str | None = None
    data_instalacao: date | None = None


class SoftwareRead(SoftwareBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
