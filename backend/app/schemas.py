# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Optional
import datetime

class ProductoCreate(BaseModel):
    nombre: str
    precio_final: float
    cuotas_cantidad: int = 1
    cuotas_valor: float
    garantia_meses: int = 0
    stock: int = 0

class ProductoOut(ProductoCreate):
    id: int

    class Config:
        from_attributes = True

class ItemPedidoCreate(BaseModel):
    producto_id: int
    cantidad: int

class ItemPedidoOut(BaseModel):
    id: int
    pedido_id: int
    producto_id: int
    cantidad: int
    precio_unitario: float
    producto: ProductoOut

    class Config:
        from_attributes = True

class PedidoCreate(BaseModel):
    nombre_cliente: Optional[str] = "Comprador Anónimo"
    email_cliente: Optional[str] = "comprador@ejemplo.com"
    items: List[ItemPedidoCreate]

class PedidoOut(BaseModel):
    id: int
    fecha: datetime.datetime
    estado: str
    total: float
    items: List[ItemPedidoOut]

    class Config:
        from_attributes = True
