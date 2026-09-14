from fastapi.testclient import TestClient
from datetime import datetime, timezone, timedelta
from app.main import app
from app.db.database import SessionLocal
from app.db import models

client = TestClient(app)

def run_all_tests():
    print("=== INICIANDO PRUEBAS DE BACKEND ===")
    
    # 1. Registro de Usuario A y B
    email_a = f"test_a_{int(datetime.now().timestamp())}@test.com"
    email_b = f"test_b_{int(datetime.now().timestamp())}@test.com"
    
    res_reg_a = client.post("/auth/registro", json={
        "nombre": "Comprador A",
        "email": email_a,
        "password": "Password123!",
        "consentimiento": True
    })
    assert res_reg_a.status_code == 201, f"Fallo registro A: {res_reg_a.text}"
    token_a = res_reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}
    print("[OK] Usuario A registrado con éxito")

    res_reg_b = client.post("/auth/registro", json={
        "nombre": "Comprador B",
        "email": email_b,
        "password": "Password123!",
        "consentimiento": True
    })
    assert res_reg_b.status_code == 201, f"Fallo registro B: {res_reg_b.text}"
    token_b = res_reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    print("[OK] Usuario B registrado con éxito")

    # 2. Obtener un producto existente para pruebas
    db = SessionLocal()
    producto = db.query(models.Producto).filter(models.Producto.stock > 5).first()
    assert producto is not None, "No hay productos con stock suficiente para las pruebas"
    prod_id = producto.id
    prod_nombre = producto.nombre
    stock_inicial = producto.stock
    precio = producto.precio_final
    db.close()
    print(f"[OK] Producto de prueba: {prod_nombre} (ID: {prod_id}) - Stock inicial: {stock_inicial}")

    # 3. Prueba de Rollback: Pedir más unidades de las disponibles
    res_stock_insuficiente = client.post("/pedidos", headers=headers_a, json={
        "items": [{"producto_id": prod_id, "cantidad": stock_inicial + 999}]
    })
    assert res_stock_insuficiente.status_code == 409, f"Esperaba 409 pero obtuve {res_stock_insuficiente.status_code}"
    detail_msg = res_stock_insuficiente.json()["detail"]
    assert prod_nombre in detail_msg and str(stock_inicial) in detail_msg, f"El mensaje 409 no detalla stock o producto: {detail_msg}"
    print(f"[OK] 409 correcto con stock insuficiente: {detail_msg}")

    # Verificar que el rollback no tocó el stock
    db = SessionLocal()
    prod_despues_409 = db.query(models.Producto).filter(models.Producto.id == prod_id).first()
    assert prod_despues_409.stock == stock_inicial, "El stock cambió tras un 409 (falta rollback!)"
    db.close()
    print("[OK] Rollback verificado: Stock intacto tras error 409")

    # 4. Checkout exitoso con stock válido
    cantidad_comprar = 2
    res_pedido = client.post("/pedidos", headers=headers_a, json={
        "items": [{"producto_id": prod_id, "cantidad": cantidad_comprar}]
    })
    assert res_pedido.status_code == 201, f"Fallo crear pedido: {res_pedido.text}"
    pedido_data = res_pedido.json()
    pedido_id = pedido_data["id"]
    assert pedido_data["estado"] == "pendiente"
    assert len(pedido_data["items"]) == 1
    assert "creado_en" in pedido_data
    print(f"[OK] Pedido #{pedido_id} creado con 201")

    # Verificar que el stock bajó exactamente en la cantidad comprada
    db = SessionLocal()
    prod_despues_compra = db.query(models.Producto).filter(models.Producto.id == prod_id).first()
    assert prod_despues_compra.stock == stock_inicial - cantidad_comprar, "El stock no bajó correctamente"
    db.close()
    print(f"[OK] Stock descontado correctamente: {stock_inicial} -> {stock_inicial - cantidad_comprar}")

    # 5. Historial de pedidos (/pedidos/mios) y permisos (/pedidos/{id})
    res_mios_a = client.get("/pedidos/mios", headers=headers_a)
    assert res_mios_a.status_code == 200
    pedidos_a = res_mios_a.json()
    assert any(p["id"] == pedido_id for p in pedidos_a), "El pedido creado no figura en /pedidos/mios de A"
    print("[OK] /pedidos/mios devuelve los pedidos del usuario")

    # Pedir pedido de A con usuario B -> debe dar 404
    res_ajeno = client.get(f"/pedidos/{pedido_id}", headers=headers_b)
    assert res_ajeno.status_code == 404, f"Esperaba 404 para pedido ajeno pero dio {res_ajeno.status_code}"
    print("[OK] Permiso verificado: Usuario B recibe 404 al consultar pedido de A")

    # Pedir pedido de A con usuario A -> debe dar 200
    res_propio = client.get(f"/pedidos/{pedido_id}", headers=headers_a)
    assert res_propio.status_code == 200
    print("[OK] Usuario A consulta su propio pedido exitosamente (200)")

    # 6. Revocación de compra (Botón de Arrepentimiento)
    res_revocacion = client.post(f"/pedidos/{pedido_id}/revocacion", headers=headers_a)
    assert res_revocacion.status_code == 201, f"Error en revocación: {res_revocacion.text}"
    codigo_revocacion = res_revocacion.json()["codigo"]
    assert codigo_revocacion.startswith("ARR-"), f"Código no tiene prefijo ARR-: {codigo_revocacion}"
    print(f"[OK] Revocación exitosa con código generado: {codigo_revocacion}")

    # Verificar que el stock fue reintegrado
    db = SessionLocal()
    prod_tras_revocar = db.query(models.Producto).filter(models.Producto.id == prod_id).first()
    assert prod_tras_revocar.stock == stock_inicial, f"El stock no volvió al valor inicial: {prod_tras_revocar.stock} != {stock_inicial}"
    # Verificar que el estado del pedido es cancelado
    ped_db = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    assert ped_db.estado == "cancelado"
    db.close()
    print("[OK] Stock reintegrado al catálogo y pedido en estado 'cancelado'")

    # Intentar revocar por segunda vez -> debe dar 409
    res_segunda_rev = client.post(f"/pedidos/{pedido_id}/revocacion", headers=headers_a)
    assert res_segunda_rev.status_code == 409
    # Confirmar que el stock NO volvió a subir
    db = SessionLocal()
    prod_tras_segunda = db.query(models.Producto).filter(models.Producto.id == prod_id).first()
    assert prod_tras_segunda.stock == stock_inicial
    db.close()
    print("[OK] Segunda revocación rechazada con 409 sin alterar stock")

    # 7. Revocación fuera de plazo (> 10 días corridos)
    # Creamos un pedido y cambiamos artificialmente su creado_en a hace 15 días
    res_ped_viejo = client.post("/pedidos", headers=headers_a, json={
        "items": [{"producto_id": prod_id, "cantidad": 1}]
    })
    assert res_ped_viejo.status_code == 201
    ped_viejo_id = res_ped_viejo.json()["id"]

    db = SessionLocal()
    ped_viejo = db.query(models.Pedido).filter(models.Pedido.id == ped_viejo_id).first()
    ped_viejo.creado_en = datetime.now(timezone.utc) - timedelta(days=15)
    db.commit()
    db.close()

    res_rev_vencida = client.post(f"/pedidos/{ped_viejo_id}/revocacion", headers=headers_a)
    assert res_rev_vencida.status_code == 409
    assert "10 días corridos" in res_rev_vencida.json()["detail"]
    print("[OK] Revocación rechazada con 409 para pedido con más de 10 días")

    # 8. Consulta y exportación de datos personales (ARCO)
    res_datos = client.get("/usuarios/me/datos", headers=headers_a)
    assert res_datos.status_code == 200
    datos_a = res_datos.json()
    assert "usuario" in datos_a and "pedidos" in datos_a and "solicitudes_revocacion" in datos_a
    assert datos_a["fecha_consentimiento"] is not None
    print("[OK] GET /usuarios/me/datos incluye usuario, fecha de consentimiento, pedidos y solicitudes")

    res_exportar = client.get("/usuarios/me/exportar", headers=headers_a)
    assert res_exportar.status_code == 200
    assert "attachment; filename=mis_datos.json" in res_exportar.headers.get("content-disposition", "")
    print("[OK] GET /usuarios/me/exportar descarga archivo JSON con header Content-Disposition")

    # 9. Eliminación / Baja de cuenta anonimizada
    res_baja = client.delete("/usuarios/me", headers=headers_a)
    assert res_baja.status_code == 200
    print("[OK] DELETE /usuarios/me ejecutado con éxito")

    # Verificar que el usuario ahora está inactivo y anonimizado en DB
    db = SessionLocal()
    usr_db = db.query(models.Usuario).filter(models.Usuario.id == datos_a["usuario"]["id"]).first()
    assert usr_db.activo is False
    assert usr_db.fecha_baja is not None
    assert "anonimo_" in usr_db.email
    # Verificar que sus pedidos siguen existiendo en la base de datos
    pedidos_persistidos = db.query(models.Pedido).filter(models.Pedido.usuario_id == usr_db.id).all()
    assert len(pedidos_persistidos) > 0, "Los pedidos del usuario anonimizado fueron borrados indebidamente"
    db.close()
    print("[OK] En base de datos: Usuario anonimizado, marcado inactivo con fecha_baja, y sus pedidos se conservan")

    # Intentar usar el MISMO token de usuario A para consultar /auth/me o /pedidos/mios -> debe dar 401
    res_token_invalido = client.get("/auth/me", headers=headers_a)
    assert res_token_invalido.status_code == 401, f"Esperaba 401 con usuario inactivo pero dio {res_token_invalido.status_code}"
    print("[OK] Token rechazado con 401 tras la baja de cuenta")

    print("\n=======================================================")
    print("¡TODAS LAS PRUEBAS DE BACKEND PASARON EXITOSAMENTE (100%)!")
    print("=======================================================")

if __name__ == "__main__":
    run_all_tests()
