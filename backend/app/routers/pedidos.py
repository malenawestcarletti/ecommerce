from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.db import models
from app.schemas.pedido import PedidoCreate, PedidoOut, RevocacionResponse
from app.services import pedido_service, revocacion_service

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.post("/", response_model=PedidoOut, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=PedidoOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def crear_pedido_endpoint(
    datos: PedidoCreate,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return pedido_service.crear_pedido(db, usuario, datos)


# IMPORTANTE: /mios DEBE estar declarado ANTES que /{pedido_id}
# para que FastAPI no intente parsear "mios" como un int ID.
@router.get("/mios", response_model=List[PedidoOut])
def listar_mis_pedidos(
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return pedido_service.obtener_mis_pedidos(db, usuario)


@router.get("/{pedido_id}", response_model=PedidoOut)
def ver_pedido_por_id(
    pedido_id: int,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return pedido_service.obtener_pedido_por_id(db, usuario, pedido_id)


@router.post("/{pedido_id}/revocacion", response_model=RevocacionResponse, status_code=status.HTTP_201_CREATED)
def revocar_compra_endpoint(
    pedido_id: int,
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    codigo = revocacion_service.revocar(db, usuario, pedido_id)
    return RevocacionResponse(codigo=codigo)
