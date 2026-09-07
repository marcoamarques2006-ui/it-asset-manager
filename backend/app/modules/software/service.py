"""
Service do módulo software.

Contém as regras de negócio (ex.: não permitir instalar o mesmo
software duas vezes no mesmo device). Para validar que o device
existe, chama `DeviceService` — nunca acessa o model `Device`
diretamente (baixo acoplamento entre módulos, ver `app/modules/devices`).
"""
import uuid

from app.core.exceptions import ConflictError, NotFoundError
from app.modules.devices.service import DeviceService
from app.modules.software.models import InstalledSoftware
from app.modules.software.repository import SoftwareRepository
from app.modules.software.schemas import SoftwareCreate, SoftwareUpdate


class SoftwareService:
    def __init__(self, repository: SoftwareRepository, device_service: DeviceService):
        self.repository = repository
        self.device_service = device_service

    def list_software(
        self, device_id: uuid.UUID | None = None
    ) -> list[InstalledSoftware]:
        return self.repository.list_all(device_id)

    def get_software(self, software_id: uuid.UUID) -> InstalledSoftware:
        software = self.repository.get_by_id(software_id)
        if software is None:
            raise NotFoundError(f"Software {software_id} não encontrado")
        return software

    def create_software(self, data: SoftwareCreate) -> InstalledSoftware:
        self.device_service.get_device(data.device_id)
        existing = self.repository.get_by_device_and_name(data.device_id, data.nome)
        if existing is not None:
            raise ConflictError(
                f"'{data.nome}' já está instalado no device {data.device_id}"
            )
        return self.repository.create(data)

    def update_software(
        self, software_id: uuid.UUID, data: SoftwareUpdate
    ) -> InstalledSoftware:
        software = self.get_software(software_id)
        if data.nome and data.nome != software.nome:
            existing = self.repository.get_by_device_and_name(
                software.device_id, data.nome
            )
            if existing is not None:
                raise ConflictError(
                    f"'{data.nome}' já está instalado no device {software.device_id}"
                )
        return self.repository.update(software, data)

    def delete_software(self, software_id: uuid.UUID) -> None:
        software = self.get_software(software_id)
        self.repository.delete(software)
