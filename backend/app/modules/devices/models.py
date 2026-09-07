"""
Modelo ORM do módulo devices.

Só este arquivo conhece a tabela `devices`. Nenhum outro módulo deve
importar `Device` diretamente para fazer query — deve passar pelo
repository ou service deste módulo (baixo acoplamento entre módulos).
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.types import GUID
from app.database import Base


class DeviceType(str, enum.Enum):
    DESKTOP = "desktop"
    NOTEBOOK = "notebook"
    SERVIDOR = "servidor"
    IMPRESSORA = "impressora"
    MONITOR = "monitor"
    OUTRO = "outro"


class DeviceStatus(str, enum.Enum):
    EM_USO = "em_uso"
    ESTOQUE = "estoque"
    MANUTENCAO = "manutencao"
    BAIXADO = "baixado"


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    hostname: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[DeviceType] = mapped_column(Enum(DeviceType), nullable=False)
    fabricante: Mapped[str | None] = mapped_column(String(120), nullable=True)
    modelo: Mapped[str | None] = mapped_column(String(120), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(
        String(120), unique=True, nullable=True
    )
    status: Mapped[DeviceStatus] = mapped_column(
        Enum(DeviceStatus), nullable=False, default=DeviceStatus.ESTOQUE
    )
    localizacao: Mapped[str | None] = mapped_column(String(120), nullable=True)
    usuario_responsavel: Mapped[str | None] = mapped_column(String(120), nullable=True)
    observacoes: Mapped[str | None] = mapped_column(String(2000), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
