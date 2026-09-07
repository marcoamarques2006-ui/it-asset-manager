"""
Service do módulo devices.

Contém as regras de negócio (ex.: não permitir serial_number duplicado).
O router chama apenas o service — nunca o repository diretamente.
Isso garante que toda regra de negócio passe por um único lugar,
independente de qual endpoint (ou futuro consumidor: CLI, worker,
agente) está chamando.
"""
import uuid

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.devices.models import Device
from app.modules.devices.repository import DeviceRepository
from app.modules.devices.schemas import DeviceCreate, DeviceUpdate


class DeviceService:
    def __init__(self, repository: DeviceRepository):
        self.repository = repository

    def list_devices(self) -> list[Device]:
        return self.repository.list_all()

    def get_device(self, device_id: uuid.UUID) -> Device:
        device = self.repository.get_by_id(device_id)
        if device is None:
            raise NotFoundError(f"Device {device_id} não encontrado")
        return device

    def create_device(self, data: DeviceCreate) -> Device:
        if data.serial_number:
            existing = self.repository.get_by_serial(data.serial_number)
            if existing is not None:
                raise ConflictError(
                    f"Já existe um device com serial_number '{data.serial_number}'"
                )
        return self.repository.create(data)

    def update_device(self, device_id: uuid.UUID, data: DeviceUpdate) -> Device:
        device = self.get_device(device_id)
        if data.serial_number and data.serial_number != device.serial_number:
            existing = self.repository.get_by_serial(data.serial_number)
            if existing is not None:
                raise ConflictError(
                    f"Já existe um device com serial_number '{data.serial_number}'"
                )
        return self.repository.update(device, data)

    def delete_device(self, device_id: uuid.UUID) -> None:
        device = self.get_device(device_id)
        self.repository.delete(device)
