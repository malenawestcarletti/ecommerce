from tests.ayudantes import cuerpo_pedido
from app.db import models


def test_arrepentimiento_sin_sesion(client, cliente, producto, db):
    """
    Test de revocación / arrepentimiento sin sesión activa conforme a Ley 24.240 y Disp 954/2025.
    Debe responder 201 con código de cancelación y restituir el stock al catálogo.
    """
    stock_inicial = producto.stock
    cantidad_comprada = 2

    # 1. Crear un pedido con el usuario cliente
    res_pedido = client.post("/pedidos", headers=cliente, json=cuerpo_pedido(producto.id, cantidad_comprada))
    assert res_pedido.status_code == 201
    pedido_id = res_pedido.json()["id"]

    # Verificar que el stock se descontó temporalmente
    prod_db = db.query(models.Producto).filter(models.Producto.id == producto.id).first()
    assert prod_db.stock == stock_inicial - cantidad_comprada

    # 2. Ejercer arrepentimiento SIN sesión (sin encabezado Authorization)
    res_arrepentimiento = client.post(f"/pedidos/{pedido_id}/revocacion")
    assert res_arrepentimiento.status_code == 201
    datos = res_arrepentimiento.json()
    assert "codigo" in datos
    assert datos["codigo"].startswith("ARR-")

    # 3. Verificar que el stock fue reintegrado al catálogo en su totalidad
    db.refresh(prod_db)
    assert prod_db.stock == stock_inicial

    # 4. Verificar que el pedido pasó a estado cancelado
    ped_db = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    assert ped_db.estado == "cancelado"


def test_arrepentimiento_id_inexistente(client):
    """
    Test de arrepentimiento con ID inexistente: genera código de recepción y responde 201
    sin revelar información sobre la existencia o pertenencia del pedido (anti-enumeración).
    """
    res = client.post("/pedidos/999999/revocacion")
    assert res.status_code == 201
    datos = res.json()
    assert "codigo" in datos
    assert datos["codigo"].startswith("ARR-")
