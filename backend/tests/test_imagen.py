import io


def test_archivo_trampa_por_admin_415(client, admin, producto):
    """
    Test de archivo trampa (.txt nombrado como .png con texto plano) subido por admin.
    Debe fallar la validación de magic bytes / firma real y responder 415 Unsupported Media Type.
    """
    contenido_falso = b"Esto no es una imagen real, es un archivo de texto trampa fingiendo ser PNG."
    res = client.post(
        f"/productos/{producto.id}/imagen",
        headers=admin,
        files={"archivo": ("trampa.png", io.BytesIO(contenido_falso), "image/png")},
    )
    assert res.status_code == 415


def test_archivo_trampa_subido_por_cliente_403(client, cliente, producto):
    """
    Test de archivo trampa subido por un usuario con rol de cliente común.
    Debe ser bloqueado por autorización previa y responder 403 Forbidden.
    """
    contenido_falso = b"Texto cualquiera subido por cliente."
    res = client.post(
        f"/productos/{producto.id}/imagen",
        headers=cliente,
        files={"archivo": ("trampa.png", io.BytesIO(contenido_falso), "image/png")},
    )
    assert res.status_code == 403


def test_subida_imagen_sin_sesion_401(client, producto):
    """
    Test de intento de subida de imagen sin sesión activa.
    Debe ser rechazado con 401 Unauthorized.
    """
    contenido = b"\x89PNG\r\n\x1a\n" + b"\x00" * 30
    res = client.post(
        f"/productos/{producto.id}/imagen",
        files={"archivo": ("foto.png", io.BytesIO(contenido), "image/png")},
    )
    assert res.status_code == 401
