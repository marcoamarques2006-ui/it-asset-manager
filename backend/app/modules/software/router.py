"""
Router (camada HTTP) do módulo software.

Responsabilidade única: traduzir request/response HTTP <-> chamadas
de service. Nenhuma regra de negócio deve viver aqui.
"""
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.devices.repository import DeviceRepository
from app.modules.devices.service import DeviceService
from app.modules.software.repository import SoftwareRepository
from app.modules.software.schemas import SoftwareCreate, SoftwareRead, SoftwareUpdate
from app.modules.software.service import SoftwareService

router = APIRouter(prefix="/software", tags=["software"])


def get_software_service(db: Session = Depends(get_db)) -> SoftwareService:
    return SoftwareService(SoftwareRepository(db), DeviceService(DeviceRepository(db)))


@router.get("", response_model=list[SoftwareRead])
def list_software(
    device_id: uuid.UUID | None = Query(default=None),
    service: SoftwareService = Depends(get_software_service),
):
    return service.list_software(device_id)


@router.get("/{software_id}", response_model=SoftwareRead)
def get_software(
    software_id: uuid.UUID, service: SoftwareService = Depends(get_software_service)
):
    return service.get_software(software_id)


@router.post("", response_model=SoftwareRead, status_code=status.HTTP_201_CREATED)
def create_software(
    payload: SoftwareCreate, service: SoftwareService = Depends(get_software_service)
):
    return service.create_software(payload)


@router.patch("/{software_id}", response_model=SoftwareRead)
def update_software(
    software_id: uuid.UUID,
    payload: SoftwareUpdate,
    service: SoftwareService = Depends(get_software_service),
):
    return service.update_software(software_id, payload)


@router.delete("/{software_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_software(
    software_id: uuid.UUID, service: SoftwareService = Depends(get_software_service)
):
    service.delete_software(software_id)
