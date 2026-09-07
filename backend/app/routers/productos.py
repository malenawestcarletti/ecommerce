from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app import schemas
from app.dependencies import get_db
from app.services import productos as productos_service

router = APIRouter(prefix="/productos", tags=["Productos"])

@router.get("/", response_model=list[schemas.ProductoOut])
@router.get("", response_model=list[schemas.ProductoOut], include_in_schema=False)
def listar_productos(
    skip: int = 0,
    limit: int = 10,
    nombre: str | None = None,
    precio_max: float | None = None,
    db: Session = Depends(get_db)
):
    return productos_service.listar_productos(
        db, skip=skip, limit=limit, nombre=nombre, precio_max=precio_max
    )

@router.post("/", response_model=schemas.ProductoOut, status_code=201)
@router.post("", response_model=schemas.ProductoOut, status_code=201, include_in_schema=False)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    return productos_service.crear_producto(db, producto)
