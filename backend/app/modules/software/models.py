"""
Modelo ORM do módulo software.

Representa softwares associados a um device. Segue o mesmo padrão de
`devices/models.py` — expanda com repository/service/router quando for
implementar as telas de software.
"""
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.types import GUID
from app.database import Base


class InstalledSoftware(Base):
    __tablename__ = "installed_software"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(), primary_key=True, default=uuid.uuid4
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False
    )
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    versao: Mapped[str | None] = mapped_column(String(50), nullable=True)
    data_instalacao: Mapped[date | None] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
