from app.core.database import Base, SessionLocal, engine, get_db
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoResponse
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session 

# Crea las tablas en PostgreSQL si no existen al iniciar la app
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Dulce Vicio - E-Commerce API",
    description="Servidor Backend para Dulce Vicio. Cumple con la Ley N° 24.240 de Defensa del Consumidor.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- EVENTO DE INICIALIZACIÓN: Carga la lista inicial en PostgreSQL ---
@app.on_event("startup")
def cargar_productos_iniciales():
    db = SessionLocal()
    try:
        # Si la base de datos está vacía, se insertan tus productos originales
        if db.query(Producto).count() == 0:
            productos_db = [
                Producto(
                    nombre="Chocotorta Familiar",
                    precio_final=12000.0,
                    cuotas_cantidad=3,
                    cuotas_valor=4000.0,
                    garantia_meses=0,
                    stock=15,
                ),
                Producto(
                    nombre="Tiramisú Clásico",
                    precio_final=10500.0,
                    cuotas_cantidad=3,
                    cuotas_valor=3500.0,
                    garantia_meses=0,
                    stock=10,
                ),
                Producto(
                    nombre="Box de Brownies (6 unidades)",
                    precio_final=8000.0,
                    cuotas_cantidad=1,
                    cuotas_valor=8000.0,
                    garantia_meses=0,
                    stock=25,
                ),
                Producto(
                    nombre="Turrón de Quaker Tradicional",
                    precio_final=6500.0,
                    cuotas_cantidad=1,
                    cuotas_valor=6500.0,
                    garantia_meses=0,
                    stock=20,
                ),
            ]
            db.add_all(productos_db)
            db.commit()
    finally:
        db.close()


# --- ENDPOINT RAÍZ (Información General y Marco Legal) ---
@app.get("/", tags=["General"])
async def read_root():
    """Endpoint de bienvenida que proporciona información sobre el comercio electrónico
    y declara explícitamente el cumplimiento con la Ley de Defensa del
    Consumidor N° 24.240.
    """
    content = {
        "mensaje": "¡Bienvenido a la API de Dulce Vicio!",
        "pais": "Argentina",
        "marco_legal": {
            "regulacion_principal": "Ley N° 24.240 de Defensa del Consumidor",
            "detalles": (
                "Esta plataforma de comercio electrónico cumple plenamente con los derechos de las y los consumidores "
                "conforme a lo establecido en la Ley N° 24.240 de la República Argentina. Garantizamos el derecho a la "
                "información clara y detallada, el trato digno, la protección de tus datos y el derecho de revocación "
                "(botón de arrepentimiento) dentro del plazo legal de 10 días corridos desde la entrega del producto "
                "o la firma del contrato (Art. 34 de la Ley 24.240)."
            ),
            "enlace_util": "https://www.argentina.gob.ar/normativa/nacional/ley-24240-638",
        },
        "estado": "Operativo",
        "version": "0.1.0",
    }
    return JSONResponse(status_code=200, content=content)


# --- PASO 3: Endpoint GET Productos (Desde PostgreSQL) ---
@app.get(
    "/productos", response_model=list[ProductoResponse], tags=["Productos"]
)
def obtener_productos(db: Session = Depends(get_db)):
    """Devuelve la lista completa de productos guardados en la base de datos PostgreSQL."""
    return db.query(Producto).all()


# --- PASO 4: Endpoint POST Productos (Hacia PostgreSQL) ---
@app.post(
    "/productos",
    response_model=ProductoResponse,
    status_code=201,
    tags=["Productos"],
)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    """Agrega un nuevo producto directamente a la base de datos PostgreSQL."""
    nuevo_producto = Producto(**producto.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto