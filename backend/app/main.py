from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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


# --- PASO 1: Modelo Producto ---
class Producto(BaseModel):
    id: int
    nombre: str
    precio_final: float
    cuotas_cantidad: int
    cuotas_valor: float
    garantia_meses: int
    stock: int


# --- PASO 2: Lista en memoria (Dulce Vicio) ---
productos_db: list[Producto] = [
    Producto(
        id=1,
        nombre="Chocotorta Familiar",
        precio_final=12000.0,
        cuotas_cantidad=3,
        cuotas_valor=4000.0,
        garantia_meses=0,
        stock=15,
    ),
    Producto(
        id=2,
        nombre="Tiramisú Clásico",
        precio_final=10500.0,
        cuotas_cantidad=3,
        cuotas_valor=3500.0,
        garantia_meses=0,
        stock=10,
    ),
    Producto(
        id=3,
        nombre="Box de Brownies (6 unidades)",
        precio_final=8000.0,
        cuotas_cantidad=1,
        cuotas_valor=8000.0,
        garantia_meses=0,
        stock=25,
    ),
    Producto(
        id=4,
        nombre="Turrón de Quaker Tradicional",
        precio_final=6500.0,
        cuotas_cantidad=1,
        cuotas_valor=6500.0,
        garantia_meses=0,
        stock=20,
    ),
]


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


# --- PASO 3: Endpoint GET Productos ---
@app.get("/productos", response_model=list[Producto], tags=["Productos"])
def obtener_productos():
    """Devuelve la lista completa de productos en stock de Dulce Vicio."""
    return productos_db


# --- PASO 4: Endpoint POST Productos ---
@app.post(
    "/productos", response_model=Producto, status_code=201, tags=["Productos"]
)
def crear_producto(producto: Producto):
    """Agrega un nuevo producto a la lista en memoria."""
    productos_db.append(producto)
    return producto