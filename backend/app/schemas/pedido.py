from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from decimal import Decimal
import datetime
from app.schemas.producto import ProductoOut


class ItemIn(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)


class PedidoCreate(BaseModel):
    items: List[ItemIn] = Field(min_length=1)


class UsuarioEnPedido(BaseModel):
    id: int
    nombre: Optional[str] = None
    email: str
    rol: Optional[str] = None
    activo: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class ItemOut(BaseModel):
    id: int
    pedido_id: int
    producto_id: Optional[int] = None
    cantidad: int
    precio_unitario: Decimal
    producto: Optional[ProductoOut] = None

    model_config = ConfigDict(from_attributes=True)


class SolicitudRevocacionOut(BaseModel):
    id: int
    codigo: str
    pedido_id: int
    usuario_id: int
    creada_en: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class PedidoOut(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    usuario: Optional[UsuarioEnPedido] = None
    estado: str
    total: Decimal
    creado_en: Optional[datetime.datetime] = None
    fecha: Optional[datetime.datetime] = None
    items: List[ItemOut]
    solicitudes: List[SolicitudRevocacionOut] = []

    model_config = ConfigDict(from_attributes=True)


class RevocacionResponse(BaseModel):
    codigo: str
    mensaje: str = "Solicitud de revocación registrada exitosamente."
