from pydantic import BaseModel


# Esquema base para recibir datos en POST
class ProductoCreate(BaseModel):
    nombre: str
    precio_final: float
    cuotas_cantidad: int = 1
    cuotas_valor: float
    garantia_meses: int = 0
    stock: int = 0


# Esquema para responder en la API
class ProductoResponse(ProductoCreate):
    id: int

    class Config:
        from_attributes = True