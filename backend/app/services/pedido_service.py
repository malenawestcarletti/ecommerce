from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
import datetime
from app.db import models
from app.schemas.pedido import PedidoCreate


def crear_pedido(db: Session, usuario: models.Usuario, datos: PedidoCreate) -> models.Pedido:
    try:
        total_acumulado = Decimal("0.00")
        items_a_crear = []

        for item_in in datos.items:
            producto = db.query(models.Producto).filter(models.Producto.id == item_in.producto_id).first()
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Producto con id {item_in.producto_id} no encontrado."
                )

            if producto.stock < item_in.cantidad:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente para {producto.nombre}. Disponibles: {producto.stock} unidades."
                )

            # Descontar stock
            producto.stock -= item_in.cantidad

            # Acumular total guardando el precio del producto en ese momento
            precio = Decimal(str(producto.precio_final))
            total_acumulado += precio * item_in.cantidad

            items_a_crear.append({
                "producto_id": producto.id,
                "cantidad": item_in.cantidad,
                "precio_unitario": precio
            })

        ahora = datetime.datetime.now(datetime.timezone.utc)
        db_pedido = models.Pedido(
            usuario_id=usuario.id,
            estado="pendiente",
            total=total_acumulado,
            creado_en=ahora,
            fecha=ahora
        )
        db.add(db_pedido)
        db.flush()

        for item_data in items_a_crear:
            item_db = models.ItemPedido(
                pedido_id=db_pedido.id,
                producto_id=item_data["producto_id"],
                cantidad=item_data["cantidad"],
                precio_unitario=item_data["precio_unitario"]
            )
            db.add(item_db)

        db.commit()
        db.refresh(db_pedido)
        return db_pedido

    except Exception:
        db.rollback()
        raise


def obtener_mis_pedidos(db: Session, usuario: models.Usuario):
    return (
        db.query(models.Pedido)
        .filter(models.Pedido.usuario_id == usuario.id)
        .order_by(models.Pedido.creado_en.desc())
        .all()
    )


def obtener_pedido_por_id(db: Session, usuario: models.Usuario, pedido_id: int) -> models.Pedido:
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido or (pedido.usuario_id != usuario.id and usuario.rol != "admin"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {pedido_id} no encontrado o no pertenece a tu cuenta."
        )
    return pedido
