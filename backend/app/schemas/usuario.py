from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, List, Any
import datetime
from app.schemas.pedido import PedidoOut, SolicitudRevocacionOut


class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    consentimiento: bool = True
    acepto_tratamiento: Optional[bool] = None

    @field_validator("consentimiento")
    @classmethod
    def validar_consentimiento(cls, v):
        if v is False:
            raise ValueError("El consentimiento es obligatorio.")
        return v

    @field_validator("acepto_tratamiento")
    @classmethod
    def validar_acepto_tratamiento(cls, v):
        if v is False:
            raise ValueError("Debe aceptar el tratamiento de datos personales.")
        return v


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
