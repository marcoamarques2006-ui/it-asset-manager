"""
Schemas Pydantic do módulo devices.

Separados do modelo ORM de propósito: o schema é o contrato público
da API, o modelo é o detalhe de persistência. Mudar uma coluna no
banco não deve, por si só, mudar o contrato exposto ao cliente.
"""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.devices.models import DeviceStatus, DeviceType


class DeviceBase(BaseModel):
    hostname: str = Field(min_length=1, max_length=255)
    tipo: DeviceType
    fabricante: str | None = None
    modelo: str | None = None
    serial_number: str | None = None
    status: DeviceStatus = DeviceStatus.ESTOQUE
    localizacao: str | None = None
    usuario_responsavel: str | None = None
    observacoes: str | None = None


class DeviceCreate(DeviceBase):
    """Payload para criação. Todos os campos obrigatórios de DeviceBase."""


class DeviceUpdate(BaseModel):
    """Payload para atualização parcial (PATCH) — todos os campos opcionais."""
    hostname: str | None = Field(default=None, min_length=1, max_length=255)
    tipo: DeviceType | None = None
    fabricante: str | None = None
    modelo: str | None = None
    serial_number: str | None = None
    status: DeviceStatus | None = None
    localizacao: str | None = None
    usuario_responsavel: str | None = None
    observacoes: str | None = None


class DeviceRead(DeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
