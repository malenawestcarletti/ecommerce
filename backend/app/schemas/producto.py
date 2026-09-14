from pydantic import BaseModel, ConfigDict
from typing import Optional


class ProductoCreate(BaseModel):
    nombre: str
    precio_final: float
    cuotas_cantidad: int = 1
    cuotas_valor: float
    garantia_meses: int = 0
    stock: int = 0


class ProductoOut(ProductoCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
