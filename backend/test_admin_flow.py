import io
from fastapi.testclient import TestClient
from datetime import datetime
from app.main import app, asegurar_admin_dulcevicio
from app.db.database import SessionLocal
from app.db import models
from app.core.security import get_password_hash

client = TestClient(app)

def test_admin_flow():
    print("=== INICIANDO PRUEBAS COMPLETAS DEL PANEL DE ADMINISTRADOR ===")

    # 1. Asegurar usuario admin dulcevicio@gmail.com
    asegurar_admin_dulcevicio()

    # 2. Login con credenciales requeridas: dulcevicio@gmail.com y dulc3
    res_login = client.post("/auth/login", json={
        "email": "dulcevicio@gmail.com",
        "password": "dulc3"
    })
    assert res_login.status_code == 200, f"Fallo login admin: {res_login.text}"
    data_admin = res_login.json()
    assert data_admin["usuario"]["email"] == "dulcevicio@gmail.com"
    assert data_admin["usuario"]["rol"] == "admin"
    admin_token = data_admin["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[OK] 1. Login exitoso con dulcevicio@gmail.com y password dulc3")

    # 3. Verificar que contraseña errónea falle
    res_bad_login = client.post("/auth/login", json={
        "email": "dulcevicio@gmail.com",
        "password": "wrong_password"
    })
    assert res_bad_login.status_code == 401
    print("[OK] 2. Contraseña incorrecta rechazada con 401")

    # 4. Crear un nuevo producto desde la API
    nombre_postre = f"Tarta Selva Negra Especial {int(datetime.now().timestamp())}"
    res_crear = client.post("/productos", headers=admin_headers, json={
        "nombre": nombre_postre,
        "precio_final": 15000.0,
        "cuotas_cantidad": 3,
        "cuotas_valor": 5000.0,
        "garantia_meses": 1,
        "stock": 10
    })
    assert res_crear.status_code == 201, f"Error al crear producto: {res_crear.text}"
    prod = res_crear.json()
    prod_id = prod["id"]
    print(f"[OK] 3. Producto nuevo creado exitosamente con ID #{prod_id}: {nombre_postre}")

    # 5. Cambiar/subir imagen del producto (para productos existentes y por existir)
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"TEST_IMAGE_DATA_12345"
    res_img = client.post(
        f"/productos/{prod_id}/imagen",
        headers=admin_headers,
        files={"archivo": ("selva_negra.png", io.BytesIO(png_bytes), "image/png")}
    )
    assert res_img.status_code == 200, f"Error al subir imagen: {res_img.text}"
    prod_con_imagen = res_img.json()
    assert prod_con_imagen["imagen_url"] is not None
    assert prod_con_imagen["imagen_url"].startswith("/static/productos/")
    print(f"[OK] 4. Imagen cargada/actualizada con éxito para producto #{prod_id}: {prod_con_imagen['imagen_url']}")

    # 6. Verificar que el cliente visualiza el nuevo producto y su imagen en el catálogo
    res_catalogo = client.get(f"/productos?nombre={nombre_postre}")
    assert res_catalogo.status_code == 200
    prods_encontrados = res_catalogo.json()
    assert any(p["id"] == prod_id and p["imagen_url"] == prod_con_imagen["imagen_url"] for p in prods_encontrados)
    print("[OK] 5. Clientes visualizan el producto y su imagen en el catálogo público")

    # 7. Crear un cliente y hacer una compra de este producto
    email_cliente = f"cliente_test_{int(datetime.now().timestamp())}@ejemplo.com"
    res_reg_cliente = client.post("/auth/registro", json={
        "nombre": "Ana Compradora",
        "email": email_cliente,
        "password": "Password123!",
        "consentimiento": True
    })
    assert res_reg_cliente.status_code == 201
    cliente_token = res_reg_cliente.json()["access_token"]
    cliente_headers = {"Authorization": f"Bearer {cliente_token}"}

    res_compra = client.post("/pedidos", headers=cliente_headers, json={
        "items": [{"producto_id": prod_id, "cantidad": 2}]
    })
    assert res_compra.status_code == 201
    pedido_id = res_compra.json()["id"]
    print(f"[OK] 6. Compra realizada por cliente ({email_cliente}) con Pedido ID #{pedido_id}")

    # 8. Ver todas las compras hechas por todos los usuarios como administrador
    res_todas_compras = client.get("/pedidos/admin/todos", headers=admin_headers)
    assert res_todas_compras.status_code == 200
    todas_compras = res_todas_compras.json()
    assert len(todas_compras) > 0

    # Buscar la compra recién realizada
    compra_encontrada = next((p for p in todas_compras if p["id"] == pedido_id), None)
    assert compra_encontrada is not None, "El pedido no aparece en la lista de compras del admin"

    # Verificar que aparezca el usuario, id de compra y los detalles todo junto
    assert compra_encontrada["id"] == pedido_id
    assert compra_encontrada["usuario"] is not None
    assert compra_encontrada["usuario"]["email"] == email_cliente
    assert compra_encontrada["usuario"]["nombre"] == "Ana Compradora"
    assert len(compra_encontrada["items"]) == 1
    assert compra_encontrada["items"][0]["cantidad"] == 2
    assert compra_encontrada["total"] == "30000.00"
    print(f"[OK] 7. Visualización admin de compras exitosa: ID compra #{compra_encontrada['id']}, Usuario {compra_encontrada['usuario']['email']}, Total ${compra_encontrada['total']} y detalle de items todo junto")

    # 9. Eliminar producto como administrador
    res_eliminar = client.delete(f"/productos/{prod_id}", headers=admin_headers)
    assert res_eliminar.status_code == 200, f"Error al eliminar producto: {res_eliminar.text}"
    print(f"[OK] 8. Producto #{prod_id} eliminado exitosamente por el administrador")

    # Verificar que ya no aparezca en el catálogo
    res_catalogo_post = client.get(f"/productos?nombre={nombre_postre}")
    assert res_catalogo_post.status_code == 200
    assert not any(p["id"] == prod_id for p in res_catalogo_post.json())
    print("[OK] 9. Producto verificado: Ya no aparece en el catálogo tras la eliminación")

    # 10. Verificar que usuario no admin NO puede acceder a las funciones de administración
    res_no_admin_compras = client.get("/pedidos/admin/todos", headers=cliente_headers)
    assert res_no_admin_compras.status_code == 403
    res_no_admin_delete = client.delete(f"/productos/1", headers=cliente_headers)
    assert res_no_admin_delete.status_code == 403
    print("[OK] 10. Seguridad garantizada: Usuario no administrador es rechazado con 403")

    print("\n=======================================================")
    print("¡TODAS LAS PRUEBAS DEL PANEL DE ADMIN PASARON AL 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_admin_flow()
