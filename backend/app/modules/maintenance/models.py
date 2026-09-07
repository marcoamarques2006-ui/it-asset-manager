"""
Modelo ORM do módulo maintenance.

Histórico de manutenções/ocorrências de um device. Embrião do futuro
audit log / tasks. Siga o padrão de `devices/` para adicionar
repository/service/router quando for implementar as telas.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.types import GUID
from app.database import Base


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    descricao: Mapped[str] = mapped_column(String(2000), nullable=False)
    responsavel: Mapped[str | None] = mapped_column(String(120), nullable=True)
    data: Mapped[date] = mapped_column(Date, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
