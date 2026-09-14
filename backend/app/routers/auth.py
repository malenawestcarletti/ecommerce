from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.dependencies import get_db, get_current_user
from app.db import models
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioOut, TokenOut
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/registro", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def registrar_usuario(datos: UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Usuario).filter(models.Usuario.email == datos.email.strip().lower()).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una cuenta registrada con este correo electrónico."
        )

    ahora = datetime.now(timezone.utc)
    nuevo_usuario = models.Usuario(
        nombre=datos.nombre.strip(),
        email=datos.email.strip().lower(),
        password_hash=get_password_hash(datos.password),
        rol="customer",
        activo=True,
        fecha_consentimiento=ahora if datos.consentimiento else None
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    token = create_access_token({"sub": str(nuevo_usuario.id), "email": nuevo_usuario.email})
    return TokenOut(access_token=token, token_type="bearer", usuario=nuevo_usuario)


@router.post("/login", response_model=TokenOut)
def login_usuario(datos: UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == datos.email.strip().lower()).first()
    if not usuario or not verify_password(datos.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas. Verifique correo y contraseña.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta ha sido dada de baja previamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(usuario.id), "email": usuario.email})
    return TokenOut(access_token=token, token_type="bearer", usuario=usuario)


@router.get("/me", response_model=UsuarioOut)
def obtener_perfil_actual(usuario: models.Usuario = Depends(get_current_user)):
    return usuario
