from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean, Numeric
from sqlalchemy.orm import relationship
import datetime
from app.db.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    rol = Column(String, default="customer")
    activo = Column(Boolean, default=True)
    fecha_baja = Column(DateTime(timezone=True), nullable=True)
    fecha_consentimiento = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))

    pedidos = relationship("Pedido", back_populates="usuario")
    solicitudes = relationship("SolicitudRevocacion", back_populates="usuario")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    precio_final = Column(Float, nullable=False)
    cuotas_cantidad = Column(Integer, default=1)
    cuotas_valor = Column(Float)
    garantia_meses = Column(Integer, default=0)
    stock = Column(Integer, default=0)


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    fecha = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
    creado_en = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))
    estado = Column(String, default="pendiente")
    total = Column(Numeric(12, 2), default=0.0)

    usuario = relationship("Usuario", back_populates="pedidos")
    items = relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")
    solicitudes = relationship("SolicitudRevocacion", back_populates="pedido", cascade="all, delete-orphan")


class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer)
    precio_unitario = Column(Numeric(12, 2))

    pedido = relationship("Pedido", back_populates="items")
    producto = relationship("Producto")


class SolicitudRevocacion(Base):
    __tablename__ = "solicitudes_revocacion"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String, unique=True, index=True, nullable=False)
    pedido_id = Column(Integer, ForeignKey("pedidos.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    creada_en = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc))

    pedido = relationship("Pedido", back_populates="solicitudes")
    usuario = relationship("Usuario", back_populates="solicitudes")
