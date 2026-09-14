import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.db import models
from app.schemas.usuario import UsuarioDatosOut, UsuarioOut
from app.schemas.pedido import PedidoOut, SolicitudRevocacionOut

router = APIRouter(prefix="/usuarios", tags=["Usuarios y Derechos ARCO"])


def recopilar_datos_usuario(usuario: models.Usuario, db: Session) -> dict:
    pedidos = (
        db.query(models.Pedido)
        .filter(models.Pedido.usuario_id == usuario.id)
        .order_by(models.Pedido.creado_en.desc())
        .all()
    )
    solicitudes = (
        db.query(models.SolicitudRevocacion)
        .filter(models.SolicitudRevocacion.usuario_id == usuario.id)
        .order_by(models.SolicitudRevocacion.creada_en.desc())
        .all()
    )

    pedidos_out = [PedidoOut.model_validate(p).model_dump() for p in pedidos]
    solicitudes_out = [SolicitudRevocacionOut.model_validate(s).model_dump() for s in solicitudes]
    usuario_out = UsuarioOut.model_validate(usuario).model_dump()

    return {
        "usuario": usuario_out,
        "fecha_consentimiento": usuario.fecha_consentimiento,
        "pedidos": pedidos_out,
        "solicitudes_revocacion": solicitudes_out
    }


@router.get("/me/datos", response_model=UsuarioDatosOut)
def obtener_mis_datos(
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    datos = recopilar_datos_usuario(usuario, db)
    return datos


@router.get("/me/exportar")
def exportar_mis_datos(
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    datos = recopilar_datos_usuario(usuario, db)
    # Serialización obligatoria con default=str para manejar Decimals y datetimes sin error
    contenido_json = json.dumps(datos, default=str, indent=2, ensure_ascii=False)

    return Response(
        content=contenido_json,
        media_type="application/json",
        headers={
            "Content-Disposition": "attachment; filename=mis_datos.json"
        }
    )


@router.delete("/me")
def eliminar_mi_cuenta(
    usuario: models.Usuario = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Anonimizar la fila en lugar de borrarla (los pedidos se conservan sin datos personales)
    usuario_id = usuario.id
    usuario.nombre = "Usuario Anonimizado"
    usuario.email = f"anonimo_{usuario_id}@dulcevicio.com.ar"
    usuario.password_hash = ""
    usuario.activo = False
    usuario.fecha_baja = datetime.now(timezone.utc)

    db.commit()

    return {
        "mensaje": "Tu cuenta ha sido eliminada y tus datos personales han sido anonimizados correctamente.",
        "usuario_id": usuario_id,
        "activo": False
    }
