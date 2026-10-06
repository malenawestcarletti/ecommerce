from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import os
import secrets
from sqlalchemy.orm import Session
from app import schemas
from app.db import models
from app.dependencies import get_db, require_admin
from app.services import productos as productos_service
from app.utils.archivos import parece_imagen

router = APIRouter(prefix="/productos", tags=["Productos"])

EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_TAMANO_BYTES = 2 * 1024 * 1024  # 2 MB

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

@router.post("/{id}/imagen", response_model=schemas.ProductoOut, status_code=200)
async def subir_imagen_producto(
    id: int,
    archivo: UploadFile = File(..., alias="archivo"),
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    # 0. Verificar si el producto existe
    producto = db.query(models.Producto).filter(models.Producto.id == id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )

    # 1. Validación de Extensión (menor costo)
    ext = os.path.splitext(archivo.filename or "")[1].lower()
    if ext not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="El archivo no es una imagen permitida"
        )

    # 2. Validación de Tamaño (costo intermedio: lectura en memoria)
    contenido = await archivo.read()
    if len(contenido) > MAX_TAMANO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo excede el tamaño máximo permitido de 2 MB"
        )

    # 3. Validación de Firma Real / Magic Bytes (costo sobre bytes)
    if not parece_imagen(contenido):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="El archivo no es una imagen permitida"
        )

    # Nombramiento Seguro del Archivo: {producto_id}-{secrets.token_hex(8)}{ext}
    nombre_generado = f"{id}-{secrets.token_hex(8)}{ext}"

    # Persistencia en disco
    directorio_destino = os.path.join("uploads", "productos")
    os.makedirs(directorio_destino, exist_ok=True)
    ruta_fisica = os.path.join(directorio_destino, nombre_generado)

    with open(ruta_fisica, "wb") as f:
        f.write(contenido)

    # Persistencia en base de datos: /static/productos/{nombre_generado}
    producto.imagen_url = f"/static/productos/{nombre_generado}"
    db.commit()
    db.refresh(producto)

    return producto


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def eliminar_producto_endpoint(
    id: int,
    db: Session = Depends(get_db),
    admin: models.Usuario = Depends(require_admin)
):
    prod = productos_service.eliminar_producto(db, id)
    if not prod:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return {"mensaje": f"Producto '{prod.nombre}' eliminado exitosamente.", "id": id}


