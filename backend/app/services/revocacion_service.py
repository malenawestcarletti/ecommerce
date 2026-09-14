import secrets
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db import models


def generar_codigo() -> str:
    fecha = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"ARR-{fecha}-{secrets.token_hex(3).upper()}"


def revocar(db: Session, usuario: models.Usuario, pedido_id: int) -> str:
    # 1. Validación de pertenencia / existencia (404 si no existe o no es tuyo)
    pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not pedido or pedido.usuario_id != usuario.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El pedido #{pedido_id} no existe o no pertenece a tu cuenta."
        )

    # 2. Validación de estado: no debe estar ya cancelado (409)
    if pedido.estado == "cancelado":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El pedido #{pedido_id} ya ha sido cancelado o revocado con anterioridad."
        )

    # 3. Validación de plazo legal: dentro de los 10 días corridos (409)
    fecha_pedido = pedido.creado_en or pedido.fecha
    if fecha_pedido.tzinfo is None:
        fecha_pedido = fecha_pedido.replace(tzinfo=timezone.utc)

    ahora = datetime.now(timezone.utc)
    dias_transcurridos = (ahora - fecha_pedido).total_seconds() / 86400.0

    if dias_transcurridos > 10.0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El plazo legal de 10 días corridos para ejercer el derecho de arrepentimiento ha vencido ({int(dias_transcurridos)} días transcurridos). Ley N° 24.240 y Disposición 954/2025."
        )

    # 4. Transacción atómica con rollback
    try:
        # Reintegrar stock a cada producto comprado
        for item in pedido.items:
            producto = db.query(models.Producto).filter(models.Producto.id == item.producto_id).first()
            if producto:
                producto.stock += item.cantidad

        # Cambiar estado del pedido
        pedido.estado = "cancelado"

        # Generar código único y crear solicitud de revocación
        codigo = generar_codigo()
        solicitud = models.SolicitudRevocacion(
            codigo=codigo,
            pedido_id=pedido.id,
            usuario_id=usuario.id,
            creada_en=ahora
        )
        db.add(solicitud)
        db.commit()
        db.refresh(solicitud)
        return codigo

    except Exception:
        db.rollback()
        raise
