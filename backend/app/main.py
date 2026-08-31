from app.core.database import Base, SessionLocal, engine, get_db
from app import models, schemas
from app.services import productos as productos_service
from app.services import pedidos as pedidos_service
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

# Crea las tablas en PostgreSQL si no existen al iniciar la app (Base.metadata.create_all is a fallback, but Alembic also manages it)
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
        if db.query(models.Producto).count() == 0:
            productos_db = [
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
            ]
            db.add_all(productos_db)
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

# --- ENDPOINTS PRODUCTOS ---
@app.get("/productos", response_model=list[schemas.ProductoOut], tags=["Productos"])
def listar_productos(
    skip: int = 0,
    limit: int = 10,
    nombre: str | None = None,
    precio_max: float | None = None,
    db: Session = Depends(get_db)
):
    return productos_service.listar_productos(db, skip=skip, limit=limit, nombre=nombre, precio_max=precio_max)

@app.post("/productos", response_model=schemas.ProductoOut, status_code=201, tags=["Productos"])
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    return productos_service.crear_producto(db, producto)

# --- ENDPOINTS PEDIDOS (Para la perspectiva del comprador) ---
@app.post("/pedidos", response_model=schemas.PedidoOut, status_code=201, tags=["Pedidos"])
def crear_pedido(pedido: schemas.PedidoCreate, db: Session = Depends(get_db)):
    return pedidos_service.crear_pedido(db, pedido)

@app.post("/pedidos/{id}/cancelar", response_model=schemas.PedidoOut, tags=["Pedidos"])
def cancelar_pedido(id: int, db: Session = Depends(get_db)):
    return pedidos_service.cancelar_pedido(db, id)