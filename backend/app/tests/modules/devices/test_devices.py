"""
Testes do módulo devices.

Servem como especificação executável do comportamento esperado e como
modelo de teste para os módulos software e maintenance.
"""


def test_create_device(client):
    payload = {
        "hostname": "PC-001",
        "tipo": "desktop",
        "serial_number": "SN-0001",
        "status": "em_uso",
    }
    response = client.post("/api/v1/devices", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["hostname"] == "PC-001"
    assert body["status"] == "em_uso"


def test_create_device_with_duplicate_serial_returns_conflict(client):
    payload = {"hostname": "PC-001", "tipo": "desktop", "serial_number": "SN-DUP"}
    client.post("/api/v1/devices", json=payload)

    duplicate = {"hostname": "PC-002", "tipo": "notebook", "serial_number": "SN-DUP"}
    response = client.post("/api/v1/devices", json=duplicate)

    assert response.status_code == 409


def test_get_nonexistent_device_returns_404(client):
    response = client.get("/api/v1/devices/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_list_devices_returns_created_devices(client):
    client.post("/api/v1/devices", json={"hostname": "PC-A", "tipo": "desktop"})
    client.post("/api/v1/devices", json={"hostname": "PC-B", "tipo": "notebook"})

    response = client.get("/api/v1/devices")

    assert response.status_code == 200
    hostnames = [d["hostname"] for d in response.json()]
    assert "PC-A" in hostnames and "PC-B" in hostnames


def test_update_device_status(client):
    create = client.post(
        "/api/v1/devices", json={"hostname": "PC-C", "tipo": "servidor"}
    )
    device_id = create.json()["id"]

    response = client.patch(
        f"/api/v1/devices/{device_id}", json={"status": "manutencao"}
    )

    assert response.status_code == 200
    assert response.json()["status"] == "manutencao"


def test_delete_device_is_idempotent_in_effect(client):
    create = client.post(
        "/api/v1/devices", json={"hostname": "PC-D", "tipo": "desktop"}
    )
    device_id = create.json()["id"]

    first_delete = client.delete(f"/api/v1/devices/{device_id}")
    assert first_delete.status_code == 204

    # Deletar de novo o mesmo recurso deve ser um 404 previsível,
    # nunca um erro de servidor — o estado final do sistema é o mesmo.
    second_delete = client.delete(f"/api/v1/devices/{device_id}")
    assert second_delete.status_code == 404
