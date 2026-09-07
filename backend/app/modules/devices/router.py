"""
Router (camada HTTP) do módulo devices.

Responsabilidade única: traduzir request/response HTTP <-> chamadas
de service. Nenhuma regra de negócio deve viver aqui.
"""
import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.modules.devices.repository import DeviceRepository
from app.modules.devices.schemas import DeviceCreate, DeviceRead, DeviceUpdate
from app.modules.devices.service import DeviceService

router = APIRouter(prefix="/devices", tags=["devices"])


def get_device_service(db: Session = Depends(get_db)) -> DeviceService:
    return DeviceService(DeviceRepository(db))


@router.get("", response_model=list[DeviceRead])
def list_devices(service: DeviceService = Depends(get_device_service)):
    return service.list_devices()


@router.get("/{device_id}", response_model=DeviceRead)
def get_device(
    device_id: uuid.UUID, service: DeviceService = Depends(get_device_service)
):
    return service.get_device(device_id)


@router.post("", response_model=DeviceRead, status_code=status.HTTP_201_CREATED)
def create_device(
    payload: DeviceCreate, service: DeviceService = Depends(get_device_service)
):
    return service.create_device(payload)


@router.patch("/{device_id}", response_model=DeviceRead)
def update_device(
    device_id: uuid.UUID,
    payload: DeviceUpdate,
    service: DeviceService = Depends(get_device_service),
):
    return service.update_device(device_id, payload)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(
    device_id: uuid.UUID, service: DeviceService = Depends(get_device_service)
):
    service.delete_device(device_id)
