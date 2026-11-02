from tests.ayudantes import cuerpo_pedido
from app.db import models


def test_compra_descuenta_stock(client, cliente, producto, db):
    """
    Test de compra exitosa que descuenta el stock del catálogo correctamente (201).
    """
    stock_inicial = producto.stock
    cantidad = 2

    res = client.post("/pedidos", headers=cliente, json=cuerpo_pedido(producto.id, cantidad))
    assert res.status_code == 201
    datos_pedido = res.json()
    assert datos_pedido["estado"] == "pendiente"

    # Verificar descuento de stock en la base de datos
    prod_db = db.query(models.Producto).filter(models.Producto.id == producto.id).first()
    assert prod_db.stock == stock_inicial - cantidad


def test_falta_stock_409_y_rollback(client, cliente, producto, db):
    """
    Test de falta de stock que devuelve 409 y realiza rollback
    (stock intacto y sin registros en /pedidos/mios).
    """
    stock_inicial = producto.stock
    cantidad_excesiva = stock_inicial + 50

    res = client.post("/pedidos", headers=cliente, json=cuerpo_pedido(producto.id, cantidad_excesiva))
    assert res.status_code == 409

    # 1. Verificar que el stock en la base de datos no fue alterado (Rollback)
    prod_db = db.query(models.Producto).filter(models.Producto.id == producto.id).first()
    assert prod_db.stock == stock_inicial

    # 2. Verificar que no se generó ningún pedido en /pedidos/mios
    res_mios = client.get("/pedidos/mios", headers=cliente)
    assert res_mios.status_code == 200
    assert len(res_mios.json()) == 0


def test_precio_congelado(client, cliente, producto, db):
    """
    Test de precio congelado al realizar la compra: si el precio del producto cambia
    posteriormente en el catálogo, el pedido conserva el precio histórico contratado.
    """
    precio_compra = float(producto.precio_final)

    res_pedido = client.post("/pedidos", headers=cliente, json=cuerpo_pedido(producto.id, 1))
    assert res_pedido.status_code == 201
    pedido_id = res_pedido.json()["id"]

    # Simular aumento o modificación de precio en el producto del catálogo
    prod_db = db.query(models.Producto).filter(models.Producto.id == producto.id).first()
    prod_db.precio_final = precio_compra * 2.5
    db.commit()

    # Consultar el pedido y verificar que mantiene el precio original congelado
    res_ver_pedido = client.get(f"/pedidos/{pedido_id}", headers=cliente)
    assert res_ver_pedido.status_code == 200
    item = res_ver_pedido.json()["items"][0]
    assert float(item["precio_unitario"]) == precio_compra


def test_compra_sin_sesion_401(client, producto):
    """
    Test de intento de compra sin sesión activa (401 Unauthorized).
    """
    res = client.post("/pedidos", json=cuerpo_pedido(producto.id, 1))
    assert res.status_code == 401
