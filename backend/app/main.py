from multiprocessing import context
from multiprocessing import context
from multiprocessing import context
from multiprocessing import context
from alembic import context
from alembic import context
from app.dependencies import get_db
from fastapi import Depends
from sqlalchemy.orm import Session
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import os
from datetime import datetime, timezone

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.database import Base, SessionLocal, engine
from app.db import models
from app.routers import productos, auth, pedidos, usuarios
from sqlalchemy import text
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends


# Crea las tablas en PostgreSQL si no existen al iniciar la app
Base.metadata.create_all(bind=engine)

# Asegura que la carpeta uploads/productos exista
os.makedirs("uploads/productos", exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Servidor Backend para Dulce Vicio. Cumple con la Ley N° 24.240 de Defensa del Consumidor y Disposición 954/2025.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de archivos estáticos para servicio de imágenes de productos
app.mount("/static", StaticFiles(directory="uploads"), name="static")

# Monta los routers modulares
app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(pedidos.router)
app.include_router(usuarios.router)



def asegurar_admin_dulcevicio():
    db = SessionLocal()
    try:
        email_admin = "dulcevicio@gmail.com"
        admin = db.query(models.Usuario).filter(models.Usuario.email == email_admin).first()
        if not admin:
            nuevo_admin = models.Usuario(
                nombre="Administrador Dulce Vicio",
                email=email_admin,
                password_hash=get_password_hash("dulc3"),
                rol="admin",
                activo=True,
                fecha_consentimiento=datetime.now(timezone.utc),
            )
            db.add(nuevo_admin)
            db.commit()
            print("Usuario Administrador dulcevicio@gmail.com creado con éxito.")
        else:
            admin.rol = "admin"
            admin.password_hash = get_password_hash("dulc3")
            admin.activo = True
            db.commit()
            print("Usuario Administrador dulcevicio@gmail.com verificado y actualizado.")
    except Exception as e:
        db.rollback()
        print(f"Error al asegurar usuario admin: {e}")
    finally:
        db.close()


# --- EVENTO DE INICIALIZACIÓN: Carga la lista inicial en PostgreSQL y asegura admin ---
@app.on_event("startup")
def startup_event():
    asegurar_admin_dulcevicio()
    cargar_productos_iniciales()


def cargar_productos_iniciales():
    db = SessionLocal()
    try:
        productos_existentes = db.query(models.Producto).count()
        if productos_existentes < 5:
            nuevos_productos = [
                models.Producto(
                    nombre="Chocotorta Familiar",
                    precio_final=12000.0,
                    cuotas_cantidad=3,
                    cuotas_valor=4000.0,
                    garantia_meses=0,
                    stock=15,
                ),
                models.Producto(
                    nombre="Tiramisú Clásico",
                    precio_final=10500.0,
                    cuotas_cantidad=3,
                    cuotas_valor=3500.0,
                    garantia_meses=0,
                    stock=10,
                ),
                models.Producto(
                    nombre="Box de Brownies (6 unidades)",
                    precio_final=8000.0,
                    cuotas_cantidad=1,
                    cuotas_valor=8000.0,
                    garantia_meses=0,
                    stock=25,
                ),
                models.Producto(
                    nombre="Turrón de Quaker Tradicional",
                    precio_final=6500.0,
                    cuotas_cantidad=1,
                    cuotas_valor=6500.0,
                    garantia_meses=0,
                    stock=20,
                ),
                models.Producto(
                    nombre="Lemon Pie Artesanal",
                    precio_final=9500.0,
                    cuotas_cantidad=1,
                    cuotas_valor=9500.0,
                    garantia_meses=0,
                    stock=12,
                ),
                models.Producto(
                    nombre="Cheesecake de Frutos Rojos",
                    precio_final=13000.0,
                    cuotas_cantidad=3,
                    cuotas_valor=4333.33,
                    garantia_meses=0,
                    stock=8,
                ),
                models.Producto(
                    nombre="Pastafrola Tradicional de Membrillo",
                    precio_final=5500.0,
                    cuotas_cantidad=1,
                    cuotas_valor=5500.0,
                    garantia_meses=0,
                    stock=18,
                ),
            ]
            if productos_existentes == 0:
                db.add_all(nuevos_productos)
            else:
                nombres_existentes = {p.nombre for p in db.query(models.Producto.nombre).all()}
                for prod in nuevos_productos:
                    if prod.nombre not in nombres_existentes:
                        db.add(prod)
            db.commit()
    finally:
        db.close()


# --- ENDPOINT RAÍZ (Información General y Marco Legal) ---
@app.get("/", tags=["General"])
async def read_root():
    content = {
        "mensaje": "¡Bienvenido a la API de Dulce Vicio!",
        "pais": "Argentina",
        "marco_legal": {
            "regulacion_principal": "Ley N° 24.240 de Defensa del Consumidor",
            "detalles": (
                "Esta plataforma de comercio electrónico cumple plenamente con los derechos de las y los consumidores "
                "conforme a lo establecido en la Ley N° 24.240 de la República Argentina y la Disposición 954/2025. "
                "Garantizamos el derecho a la información clara y detallada, el trato digno, la protección y portabilidad de tus datos, "
                "y el derecho de revocación (botón de arrepentimiento) dentro del plazo legal de 10 días corridos."
            ),
            "enlace_util": "https://www.argentina.gob.ar/normativa/nacional/ley-24240-638",
        },
        "estado": "Operativo",
        "version": "0.2.0",
    }
    return JSONResponse(status_code=200, content=content)

    Path("uploads/productos").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")
app.mount("/demo", StaticFiles(directory="app/static/demo"), name="demo")

@app.get("/salud", tags=["Salud"])
def salud(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"estado": "ok", "base": "ok"}
    