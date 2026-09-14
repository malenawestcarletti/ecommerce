from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.database import Base, SessionLocal, engine
from app.db import models
from app.routers import productos, auth, pedidos, usuarios

# Crea las tablas en PostgreSQL si no existen al iniciar la app
Base.metadata.create_all(bind=engine)

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

# Monta los routers modulares
app.include_router(auth.router)
app.include_router(productos.router)
app.include_router(pedidos.router)
app.include_router(usuarios.router)


# --- EVENTO DE INICIALIZACIÓN: Carga la lista inicial en PostgreSQL ---
@app.on_event("startup")
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