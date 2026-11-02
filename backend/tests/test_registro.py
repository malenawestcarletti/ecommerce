from tests.ayudantes import registrar


def test_rechazo_falta_consentimiento(client):
    """
    Test de rechazo por falta de consentimiento legal (acepto_tratamiento=False -> 422).
    """
    res = registrar(
        client,
        email="rechazo_consentimiento@test.com",
        password="Password123!",
        acepto_tratamiento=False,
    )
    assert res.status_code == 422


def test_registro_exitoso_y_login(client):
    """
    Test de registro exitoso (201, sin campo password en la respuesta) seguido de login (200).
    """
    email = "nuevo_usuario@test.com"
    password = "SeguraPassword123!"

    # 1. Registro exitoso
    res_reg = registrar(
        client,
        email=email,
        password=password,
        nombre="Comprador Feliz",
        consentimiento=True,
        acepto_tratamiento=True,
    )
    assert res_reg.status_code == 201
    datos_reg = res_reg.json()

    # Verificar que no se filtre password ni password_hash en la respuesta
    assert "password" not in datos_reg
    assert "password_hash" not in datos_reg
    if "usuario" in datos_reg:
        assert "password" not in datos_reg["usuario"]
        assert "password_hash" not in datos_reg["usuario"]

    # 2. Login con las credenciales creadas
    res_login = client.post("/auth/login", json={"email": email, "password": password})
    assert res_login.status_code == 200
    datos_login = res_login.json()
    assert "access_token" in datos_login
    assert datos_login["token_type"].lower() == "bearer"


def test_login_clave_incorrecta(client, cliente):
    """
    Test de rechazo de autenticación al ingresar una clave incorrecta (401).
    """
    res = client.post("/auth/login", json={
        "email": cliente.email,
        "password": "ClaveCompletamenteErronea999!"
    })
    assert res.status_code == 401
