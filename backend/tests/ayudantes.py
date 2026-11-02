import uuid
from typing import Optional, Union, Dict, Any


def registrar(
    client,
    email: Optional[str] = None,
    password: Optional[str] = "Password123!",
    nombre: Optional[str] = "Usuario Test",
    consentimiento: bool = True,
    acepto_tratamiento: Optional[bool] = None,
):
    """
    Función auxiliar para registrar un usuario en la plataforma.
    """
    if email is None:
        email = f"user_{uuid.uuid4().hex[:8]}@test.com"

    payload: Dict[str, Any] = {
        "nombre": nombre,
        "email": email,
        "password": password,
        "consentimiento": consentimiento,
    }
    if acepto_tratamiento is not None:
        payload["acepto_tratamiento"] = acepto_tratamiento

    return client.post("/auth/registro", json=payload)


def token_de(
    client,
    email: Optional[str] = None,
    password: Optional[str] = "Password123!",
    usuario: Optional[dict] = None,
) -> dict:
    """
    Función auxiliar para iniciar sesión y retornar encabezados de autenticación Bearer.
    """
    if usuario and isinstance(usuario, dict):
        email = usuario.get("email", email)
        password = usuario.get("password", password)

    res = client.post("/auth/login", json={"email": email, "password": password})
    if res.status_code != 200:
        raise ValueError(f"No se pudo autenticar usuario {email}: {res.text}")

    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def cuerpo_pedido(
    producto_id: Optional[int] = None,
    cantidad: int = 1,
    items: Optional[list] = None,
) -> dict:
    """
    Función auxiliar para formatear el cuerpo requerido por POST /pedidos.
    """
    if items is not None:
        return {"items": items}

    if producto_id is None:
        raise ValueError("Se debe proporcionar producto_id o items.")

    return {"items": [{"producto_id": int(producto_id), "cantidad": int(cantidad)}]}
