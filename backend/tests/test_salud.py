def test_salud_servicio_y_base(client):
    """
    Verifica la disponibilidad del servicio FastAPI y la conexión a la base de datos (GET /salud).
    """
    res = client.get("/salud")
    assert res.status_code == 200
    data = res.json()
    assert data["estado"] == "ok"
    assert data["base"] == "ok"
