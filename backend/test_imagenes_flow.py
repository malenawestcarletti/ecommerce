import io
from fastapi.testclient import TestClient
from datetime import datetime
from app.main import app
from app.db.database import SessionLocal
from app.db import models
from app.core.security import get_password_hash

client = TestClient(app)

def run_tests():
    print("=== INICIANDO PRUEBAS DE SUBIDA DE IMÁGENES ===")

    # 1. Crear usuario admin y usuario normal
    db = SessionLocal()
    email_admin = f"admin_{int(datetime.now().timestamp())}@test.com"
    email_normal = f"user_{int(datetime.now().timestamp())}@test.com"

    admin_user = models.Usuario(
        nombre="Administrador",
        email=email_admin,
        password_hash=get_password_hash("AdminPass123!"),
        rol="admin",
        activo=True,
    )
    normal_user = models.Usuario(
        nombre="Cliente Común",
        email=email_normal,
        password_hash=get_password_hash("UserPass123!"),
        rol="customer",
        activo=True,
    )
    db.add(admin_user)
    db.add(normal_user)
    db.commit()

    # Tomar un producto existente
    producto = db.query(models.Producto).first()
    assert producto is not None, "Debe existir al menos un producto"
    prod_id = producto.id
    db.close()

    # Login de ambos
    res_login_admin = client.post("/auth/login", json={"email": email_admin, "password": "AdminPass123!"})
    assert res_login_admin.status_code == 200
    token_admin = res_login_admin.json()["access_token"]
    headers_admin = {"Authorization": f"Bearer {token_admin}"}

    res_login_normal = client.post("/auth/login", json={"email": email_normal, "password": "UserPass123!"})
    assert res_login_normal.status_code == 200
    token_normal = res_login_normal.json()["access_token"]
    headers_normal = {"Authorization": f"Bearer {token_normal}"}

    print("[OK] Usuarios admin y normal autenticados")

    # 2. Intento de subida sin ser admin -> Debe dar 403 Forbidden
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"\x00" * 20
    res_403 = client.post(
        f"/productos/{prod_id}/imagen",
        headers=headers_normal,
        files={"archivo": ("foto.png", io.BytesIO(fake_png), "image/png")}
    )
    assert res_403.status_code == 403, f"Esperaba 403 pero dio {res_403.status_code}: {res_403.text}"
    assert "admin" in res_403.json()["detail"].lower()
    print("[OK] 403 verificado: Usuario no admin es rechazado")

    # 3. Intento de subida a producto inexistente -> Debe dar 404
    res_404 = client.post(
        "/productos/9999999/imagen",
        headers=headers_admin,
        files={"archivo": ("foto.png", io.BytesIO(fake_png), "image/png")}
    )
    assert res_404.status_code == 404, f"Esperaba 404 pero dio {res_404.status_code}"
    print("[OK] 404 verificado: Producto inexistente")

    # 4. Intento con extensión no permitida -> Debe dar 415
    res_ext_invalida = client.post(
        f"/productos/{prod_id}/imagen",
        headers=headers_admin,
        files={"archivo": ("documento.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")}
    )
    assert res_ext_invalida.status_code == 415, f"Esperaba 415 por extensión pero dio {res_ext_invalida.status_code}"
    print("[OK] 415 verificado: Extensión no permitida (.pdf)")

    # 5. Intento con archivo renombrado a .jpg pero sin magic bytes reales -> Debe dar 415
    texto_disfrazado = b"Este es un texto plano fingiendo ser JPG"
    res_magic_bytes = client.post(
        f"/productos/{prod_id}/imagen",
        headers=headers_admin,
        files={"archivo": ("trampa.jpg", io.BytesIO(texto_disfrazado), "image/jpeg")}
    )
    assert res_magic_bytes.status_code == 415, f"Esperaba 415 por magic bytes falsos pero dio {res_magic_bytes.status_code}"
    print("[OK] 415 verificado: Magic bytes falsos rechazados con 415")

    # 6. Intento con archivo > 2 MB -> Debe dar 413
    archivo_pesado = b"\xff\xd8\xff" + b"\x00" * (2 * 1024 * 1024 + 100)
    res_tamano = client.post(
        f"/productos/{prod_id}/imagen",
        headers=headers_admin,
        files={"archivo": ("gigante.jpg", io.BytesIO(archivo_pesado), "image/jpeg")}
    )
    assert res_tamano.status_code == 413, f"Esperaba 413 por tamaño pero dio {res_tamano.status_code}"
    print("[OK] 413 verificado: Archivo > 2 MB rechazado con 413")

    # 7. Subida exitosa con archivo válido (PNG)
    png_valido = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR" + b"DATOS_DE_IMAGEN_VALIDOS_12345"
    res_exito = client.post(
        f"/productos/{prod_id}/imagen",
        headers=headers_admin,
        files={"archivo": ("torta_delicia.png", io.BytesIO(png_valido), "image/png")}
    )
    assert res_exito.status_code == 200, f"Esperaba 200 pero dio {res_exito.status_code}: {res_exito.text}"
    prod_actualizado = res_exito.json()
    assert "imagen_url" in prod_actualizado
    assert prod_actualizado["imagen_url"] is not None
    assert prod_actualizado["imagen_url"].startswith("/static/productos/")
    assert str(prod_id) in prod_actualizado["imagen_url"]
    print(f"[OK] Subida exitosa 200! imagen_url: {prod_actualizado['imagen_url']}")

    # 8. Verificar que el archivo estático se puede servir
    res_estatico = client.get(prod_actualizado["imagen_url"])
    assert res_estatico.status_code == 200
    assert res_estatico.content == png_valido
    print("[OK] Archivo estático servido correctamente con HTTP 200")

    print("\n=======================================================")
    print("¡TODAS LAS PRUEBAS DE IMÁGENES PASARON EXITOSAMENTE (100%)!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
