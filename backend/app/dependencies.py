from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
import jwt
from app.db.database import SessionLocal
from app.db import models
from app.core.security import decode_access_token


# Dependencia para obtener la sesión en los endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Dependencia para obtener el usuario autenticado desde el token JWT
def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> models.Usuario:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión vencida o token ausente",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesión vencida",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión vencida o inválida",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(models.Usuario).filter(models.Usuario.id == int(user_id)).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o sesión inválida",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Chequeo de activo: un usuario dado de baja no puede seguir entrando con el token que ya tenía
    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cuenta dada de baja o inactiva",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return usuario
