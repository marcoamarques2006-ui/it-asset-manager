"""
Repository do módulo devices.

Isola toda a interação com o SQLAlchemy. O service nunca monta uma
query diretamente — sempre chama um método daqui. Isso permite trocar
a forma de persistência (ou mockar em testes) sem tocar na regra de
negócio.
"""
import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.devices.models import Device
from app.modules.devices.schemas import DeviceCreate, DeviceUpdate


class DeviceRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self) -> list[Device]:
        stmt = select(Device).order_by(Device.created_at.desc())
        return list(self.db.scalars(stmt))

    def get_by_id(self, device_id: uuid.UUID) -> Device | None:
        return self.db.get(Device, device_id)

    def get_by_serial(self, serial_number: str) -> Device | None:
        stmt = select(Device).where(Device.serial_number == serial_number)
        return self.db.scalars(stmt).first()

    def create(self, data: DeviceCreate) -> Device:
        device = Device(**data.model_dump())
        self.db.add(device)
        self.db.commit()
        self.db.refresh(device)
        return device

    def update(self, device: Device, data: DeviceUpdate) -> Device:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(device, field, value)
        self.db.commit()
        self.db.refresh(device)
        return device

    def delete(self, device: Device) -> None:
        self.db.delete(device)
        self.db.commit()
