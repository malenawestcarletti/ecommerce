from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
import datetime
from app.schemas.pedido import PedidoOut, SolicitudRevocacionOut


class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    consentimiento: bool = True


class UsuarioLogin(BaseModel):
    email: str
    password: str


class UsuarioOut(BaseModel):
    id: int
    nombre: Optional[str] = None
    email: str
    rol: str
    activo: bool
    fecha_consentimiento: Optional[datetime.datetime] = None
    fecha_baja: Optional[datetime.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut


class UsuarioDatosOut(BaseModel):
    usuario: UsuarioOut
    fecha_consentimiento: Optional[datetime.datetime] = None
    pedidos: List[PedidoOut]
    solicitudes_revocacion: List[SolicitudRevocacionOut]

    model_config = ConfigDict(from_attributes=True)
