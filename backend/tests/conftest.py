import secrets
from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base
from app.dependencies import get_db
from app.db import models
from app.core.security import get_password_hash


# Base de datos SQLite en memoria utilizando StaticPool para pruebas automatizadas
SQLALCHEMY_DATABASE_URL = "sqlite://"

engine_test = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


class AuthHeaderDict(dict):
    """
    Estructura auxiliar que funciona como dict de cabeceras HTTP (solo contiene {"Authorization": "Bearer ..."}),
    y además como objeto con atributos (.token, .id, .headers, .email, .password).
    """
    def __init__(self, token: str, user_id: int, email: str, password: str):
        headers = {"Authorization": f"Bearer {token}"}
        super().__init__(headers)
        self.token = token
        self.headers = headers
        self.id = user_id
        self.email = email
        self.password = password


class ProductoData(dict):
    """
    Estructura auxiliar para datos de producto que permite acceso por dict y por atributo.
    """
    def __init__(self, data: dict):
        super().__init__(data)
        for k, v in data.items():
            super().__setattr__(k, v)

    def __getattr__(self, item):
        try:
            return self[item]
        except KeyError:
            raise AttributeError(item)

    def __setattr__(self, key, value):
        self[key] = value
        super().__setattr__(key, value)


@pytest.fixture(autouse=True)
def db_session():
    """
    Crea las tablas en SQLite en memoria antes de cada test
    y reemplaza get_db mediante dependency_overrides.
    """
    Base.metadata.create_all(bind=engine_test)

    def _override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine_test)


@pytest.fixture
def db():
    """Sesión directa de base de datos de pruebas."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    """Cliente HTTP de pruebas para FastAPI."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def cliente(client):
    """
    Usuario con rol de cliente normal registrado y autenticado.
    Retorna un diccionario con cabeceras de autorización y atributos de usuario.
    """
    email = f"cliente_{secrets.token_hex(4)}@test.com"
    password = "ClientePass123!"
    res = client.post("/auth/registro", json={
        "nombre": "Cliente Test",
        "email": email,
        "password": password,
        "consentimiento": True,
        "acepto_tratamiento": True,
    })
    assert res.status_code == 201, f"Fallo registro cliente: {res.text}"
    data = res.json()
    token = data["access_token"]
    user_id = data["usuario"]["id"]
    return AuthHeaderDict(token, user_id, email, password)


@pytest.fixture
def admin(client):
    """
    Usuario con rol de administrador verificado y autenticado.
    Retorna un diccionario con cabeceras de autorización y atributos de admin.
    """
    email = f"admin_{secrets.token_hex(4)}@test.com"
    password = "AdminPass123!"
    db = TestingSessionLocal()
    admin_user = models.Usuario(
        nombre="Administrador Test",
        email=email,
        password_hash=get_password_hash(password),
        rol="admin",
        activo=True,
        fecha_consentimiento=datetime.now(timezone.utc),
    )
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    admin_id = admin_user.id
    db.close()

    res_login = client.post("/auth/login", json={"email": email, "password": password})
    assert res_login.status_code == 200, f"Fallo login admin: {res_login.text}"
    token = res_login.json()["access_token"]
    return AuthHeaderDict(token, admin_id, email, password)


@pytest.fixture
def producto(client):
    """
    Producto de prueba creado en el catálogo disponible para compras y modificaciones.
    """
    payload = {
        "nombre": f"Tarta Especial {secrets.token_hex(4)}",
        "precio_final": 5000.0,
        "cuotas_cantidad": 1,
        "cuotas_valor": 5000.0,
        "garantia_meses": 0,
        "stock": 10,
    }
    res = client.post("/productos", json=payload)
    assert res.status_code == 201, f"Fallo al crear producto de prueba: {res.text}"
    return ProductoData(res.json())
