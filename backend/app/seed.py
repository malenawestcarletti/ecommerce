import os
import sys
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.db import models


def ejecutar_seed():
    raw_db_url = os.environ.get("DATABASE_URL") or settings.DATABASE_URL
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

    print(f"[SEED] Conectando a la base de datos...")
    engine = create_engine(raw_db_url)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()

    try:
        # 1. Administrador Inicial
        admin_email = os.environ.get("SEED_ADMIN_EMAIL", "admin@equipo.com").strip()
        admin_pass = os.environ.get("SEED_ADMIN_PASSWORD", "una-clave-larga").strip()

        admin = db.query(models.Usuario).filter(models.Usuario.email == admin_email).first()
        if not admin:
            nuevo_admin = models.Usuario(
                nombre="Administrador",
                email=admin_email,
                password_hash=get_password_hash(admin_pass),
                rol="admin",
                activo=True,
                fecha_consentimiento=datetime.now(timezone.utc),
            )
            db.add(nuevo_admin)
            print(f"[SEED] [+] Usuario administrador creado: {admin_email}")
        else:
            admin.rol = "admin"
            admin.activo = True
            admin.password_hash = get_password_hash(admin_pass)
            print(f"[SEED] [~] Usuario administrador existente verificado y actualizado: {admin_email}")

        # 2. Productos Iniciales con imágenes de Demo
        productos_iniciales = [
            {
                "nombre": "Chocotorta Familiar",
                "precio_final": 12000.0,
                "cuotas_cantidad": 3,
                "cuotas_valor": 4000.0,
                "garantia_meses": 0,
                "stock": 15,
                "imagen_url": "/demo/chocotorta.jpg",
            },
            {
                "nombre": "Tiramisú Clásico",
                "precio_final": 10500.0,
                "cuotas_cantidad": 3,
                "cuotas_valor": 3500.0,
                "garantia_meses": 0,
                "stock": 10,
                "imagen_url": "/demo/tiramisu.jpg",
            },
            {
                "nombre": "Box de Brownies (6 unidades)",
                "precio_final": 8000.0,
                "cuotas_cantidad": 1,
                "cuotas_valor": 8000.0,
                "garantia_meses": 0,
                "stock": 25,
                "imagen_url": "/demo/brownies.jpg",
            },
            {
                "nombre": "Turrón de Quaker Tradicional",
                "precio_final": 6500.0,
                "cuotas_cantidad": 1,
                "cuotas_valor": 6500.0,
                "garantia_meses": 0,
                "stock": 20,
                "imagen_url": "/demo/turron_quaker.jpg",
            },
            {
                "nombre": "Lemon Pie Artesanal",
                "precio_final": 9500.0,
                "cuotas_cantidad": 1,
                "cuotas_valor": 9500.0,
                "garantia_meses": 0,
                "stock": 12,
                "imagen_url": "/demo/lemon_pie.jpg",
            },
            {
                "nombre": "Cheesecake de Frutos Rojos",
                "precio_final": 13000.0,
                "cuotas_cantidad": 3,
                "cuotas_valor": 4333.33,
                "garantia_meses": 0,
                "stock": 8,
                "imagen_url": "/demo/cheesecake.jpg",
            },
            {
                "nombre": "Pastafrola Tradicional de Membrillo",
                "precio_final": 5500.0,
                "cuotas_cantidad": 1,
                "cuotas_valor": 5500.0,
                "garantia_meses": 0,
                "stock": 18,
                "imagen_url": "/demo/pastafrola.jpg",
            },
        ]

        creados = 0
        actualizados = 0

        for datos in productos_iniciales:
            prod_existente = db.query(models.Producto).filter(models.Producto.nombre == datos["nombre"]).first()
            if not prod_existente:
                nuevo = models.Producto(**datos)
                db.add(nuevo)
                creados += 1
            else:
                prod_existente.precio_final = datos["precio_final"]
                prod_existente.cuotas_cantidad = datos["cuotas_cantidad"]
                prod_existente.cuotas_valor = datos["cuotas_valor"]
                prod_existente.garantia_meses = datos["garantia_meses"]
                prod_existente.stock = datos["stock"]
                prod_existente.imagen_url = datos["imagen_url"]
                actualizados += 1

        db.commit()
        print(f"[SEED] Productos procesados: {creados} creados, {actualizados} actualizados.")
        print(f"[SEED] Éxito: Base de datos poblada sin duplicación de registros.")

    except Exception as e:
        db.rollback()
        print(f"[SEED] [!] Error durante la ejecución del seed: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    ejecutar_seed()
