"""
Repository do módulo software.

Isola toda a interação com o SQLAlchemy, igual a `devices/repository.py`.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.software.models import InstalledSoftware
from app.modules.software.schemas import SoftwareCreate, SoftwareUpdate


class SoftwareRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self, device_id: uuid.UUID | None = None) -> list[InstalledSoftware]:
        stmt = select(InstalledSoftware).order_by(InstalledSoftware.created_at.desc())
        if device_id is not None:
            stmt = stmt.where(InstalledSoftware.device_id == device_id)
        return list(self.db.scalars(stmt))

    def get_by_id(self, software_id: uuid.UUID) -> InstalledSoftware | None:
        return self.db.get(InstalledSoftware, software_id)

    def get_by_device_and_name(
        self, device_id: uuid.UUID, nome: str
    ) -> InstalledSoftware | None:
        stmt = select(InstalledSoftware).where(
            InstalledSoftware.device_id == device_id,
            InstalledSoftware.nome == nome,
        )
        return self.db.scalars(stmt).first()

    def create(self, data: SoftwareCreate) -> InstalledSoftware:
        software = InstalledSoftware(**data.model_dump())
        self.db.add(software)
        self.db.commit()
        self.db.refresh(software)
        return software

    def update(
        self, software: InstalledSoftware, data: SoftwareUpdate
    ) -> InstalledSoftware:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(software, field, value)
        self.db.commit()
        self.db.refresh(software)
        return software

    def delete(self, software: InstalledSoftware) -> None:
        self.db.delete(software)
        self.db.commit()
