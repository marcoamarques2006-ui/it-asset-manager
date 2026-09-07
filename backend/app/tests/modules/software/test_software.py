"""
Testes do módulo software. Segue o padrão de app/tests/modules/devices.
"""


def _create_device(client, hostname="PC-SW-001"):
    response = client.post(
        "/api/v1/devices", json={"hostname": hostname, "tipo": "desktop"}
    )
    return response.json()["id"]


def test_create_software(client):
    device_id = _create_device(client)

    response = client.post(
        "/api/v1/software",
        json={"device_id": device_id, "nome": "Office 365", "versao": "2024"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["nome"] == "Office 365"
    assert body["device_id"] == device_id


def test_create_software_for_nonexistent_device_returns_404(client):
    response = client.post(
        "/api/v1/software",
        json={
            "device_id": "00000000-0000-0000-0000-000000000000",
            "nome": "Office 365",
        },
    )

    assert response.status_code == 404


def test_create_software_with_duplicate_name_on_same_device_returns_conflict(client):
    device_id = _create_device(client)
    payload = {"device_id": device_id, "nome": "Chrome"}
    client.post("/api/v1/software", json=payload)

    response = client.post("/api/v1/software", json=payload)

    assert response.status_code == 409


def test_same_software_name_on_different_devices_is_allowed(client):
    device_a = _create_device(client, "PC-SW-A")
    device_b = _create_device(client, "PC-SW-B")

    first = client.post(
        "/api/v1/software", json={"device_id": device_a, "nome": "Chrome"}
    )
    second = client.post(
        "/api/v1/software", json={"device_id": device_b, "nome": "Chrome"}
    )

    assert first.status_code == 201
    assert second.status_code == 201


def test_get_nonexistent_software_returns_404(client):
    response = client.get("/api/v1/software/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_list_software_filters_by_device(client):
    device_a = _create_device(client, "PC-SW-C")
    device_b = _create_device(client, "PC-SW-D")
    client.post("/api/v1/software", json={"device_id": device_a, "nome": "7-Zip"})
    client.post("/api/v1/software", json={"device_id": device_b, "nome": "VLC"})

    response = client.get(f"/api/v1/software?device_id={device_a}")

    assert response.status_code == 200
    names = [s["nome"] for s in response.json()]
    assert names == ["7-Zip"]


def test_update_software_versao(client):
    device_id = _create_device(client)
    create = client.post(
        "/api/v1/software",
        json={"device_id": device_id, "nome": "Firefox", "versao": "128"},
    )
    software_id = create.json()["id"]

    response = client.patch(
        f"/api/v1/software/{software_id}", json={"versao": "129"}
    )

    assert response.status_code == 200
    assert response.json()["versao"] == "129"


def test_delete_software_is_idempotent_in_effect(client):
    device_id = _create_device(client)
    create = client.post(
        "/api/v1/software", json={"device_id": device_id, "nome": "Zoom"}
    )
    software_id = create.json()["id"]

    first_delete = client.delete(f"/api/v1/software/{software_id}")
    assert first_delete.status_code == 204

    second_delete = client.delete(f"/api/v1/software/{software_id}")
    assert second_delete.status_code == 404
