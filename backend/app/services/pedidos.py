# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status
from app import models, schemas

def crear_pedido(db: Session, pedido_in: schemas.PedidoCreate):
    # 1. Buscar o crear el usuario comprador
    usuario = db.query(models.Usuario).filter(models.Usuario.email == pedido_in.email_cliente).first()
    if not usuario:
        usuario = models.Usuario(
            nombre=pedido_in.nombre_cliente,
            email=pedido_in.email_cliente,
            password_hash="",  # No password for anonymous checkout
            rol="customer"
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    # 2. Crear el Pedido
    db_pedido = models.Pedido(
        usuario_id=usuario.id,
        estado="pendiente",
        total=0.0
    )
    db.add(db_pedido)
    db.commit()
    db.refresh(db_pedido)

    total_acumulado = 0.0

    # 3. Procesar los items
    for item_in in pedido_in.items:
        producto = db.query(models.Producto).filter(models.Producto.id == item_in.producto_id).first()
        if not producto:
            # Revertir pedido creado si el producto no existe
            db.delete(db_pedido)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con id {item_in.producto_id} no encontrado."
            )
        
        if producto.stock < item_in.cantidad:
            # Revertir pedido
            db.delete(db_pedido)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuficiente para {producto.nombre}. Disponible: {producto.stock}, Solicitado: {item_in.cantidad}"
            )
        
        # Descontar stock
        producto.stock -= item_in.cantidad
        
        # Crear item del pedido
        item_pedido = models.ItemPedido(
            pedido_id=db_pedido.id,
            producto_id=producto.id,
            cantidad=item_in.cantidad,
            precio_unitario=producto.precio_final
        )
        db.add(item_pedido)
        
        total_acumulado += producto.precio_final * item_in.cantidad

    # 4. Actualizar total del pedido y confirmar
    db_pedido.total = total_acumulado
    db_pedido.estado = "pagado"
    db.commit()
    db.refresh(db_pedido)
    return db_pedido

def cancelar_pedido(db: Session, pedido_id: int):
    db_pedido = db.query(models.Pedido).filter(models.Pedido.id == pedido_id).first()
    if not db_pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido con id {pedido_id} no encontrado."
        )
    
    if db_pedido.estado == "cancelado":
        return db_pedido

    # Devolver stock a los productos
    for item in db_pedido.items:
        producto = db.query(models.Producto).filter(models.Producto.id == item.producto_id).first()
        if producto:
            producto.stock += item.cantidad
            
    db_pedido.estado = "cancelado"
    db.commit()
    db.refresh(db_pedido)
    return db_pedido
