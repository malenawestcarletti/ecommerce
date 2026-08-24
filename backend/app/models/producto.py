from app.core.database import Base
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, Float, Integer, String


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    precio_final = Column(Float, nullable=False)
    cuotas_cantidad = Column(Integer, default=1)
    cuotas_valor = Column(Float)
    garantia_meses = Column(Integer, default=0)
    stock = Column(Integer, default=0)