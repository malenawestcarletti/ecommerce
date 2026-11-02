# Dulce Vicio - Backend API

Servicio backend desarrollado en **FastAPI** y **SQLAlchemy** para la plataforma de pastelería artesanal Dulce Vicio, adaptado a la **Ley N° 24.240** y **Disposición N° 954/2025**.

---

## Tests

El backend cuenta con una suite completa de pruebas automatizadas con **pytest**, utilizando una base de datos SQLite en memoria (`sqlite://`) con `StaticPool` y aislamiento mediante `dependency_overrides` de FastAPI.

### Ejecución de las Pruebas

Para ejecutar la suite de pruebas automatizadas:

1. Abrir una terminal en el directorio `backend`:
   ```bash
   cd backend
   ```

2. Activar el entorno virtual:
   - **En Windows (PowerShell):**
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **En Linux / macOS:**
     ```bash
     source .venv/bin/activate
     ```

3. Ejecutar los tests en modo detallado:
   ```bash
   pytest -v
   ```

---

### Tabla de Tests de la Defensa (Clase 13)

Todos los tests requeridos para la defensa técnica se encuentran implementados y pasan en verde (**13/13 PASSED**):

| # | Archivo | Nombre del Test | Descripción del Requerimiento | Estado |
|:---:|---|---|---|:---:|
| 1 | `tests/test_salud.py` | `test_salud_servicio_y_base` | Disponibilidad del servicio y conexión a base de datos (`GET /salud` -> 200). | 🟢 **PASSED** |
| 2 | `tests/test_registro.py` | `test_rechazo_falta_consentimiento` | Rechazo de registro por falta de consentimiento legal (`acepto_tratamiento=False` -> 422). | 🟢 **PASSED** |
| 3 | `tests/test_registro.py` | `test_registro_exitoso_y_login` | Registro exitoso (201, sin filtrar password) seguido de login correcto (200). | 🟢 **PASSED** |
| 4 | `tests/test_registro.py` | `test_login_clave_incorrecta` | Rechazo de autenticación con contraseña incorrecta (401 Unauthorized). | 🟢 **PASSED** |
| 5 | `tests/test_pedidos.py` | `test_compra_descuenta_stock` | Compra exitosa que descuenta correctamente las unidades vendidas del stock (201). | 🟢 **PASSED** |
| 6 | `tests/test_pedidos.py` | `test_falta_stock_409_y_rollback` | Intento de compra con stock insuficiente genera 409 y rollback (stock intacto y sin pedidos creados). | 🟢 **PASSED** |
| 7 | `tests/test_pedidos.py` | `test_precio_congelado` | Garantía de precio congelado: el pedido conserva el valor unitario pactado al comprar ante cambios en el catálogo. | 🟢 **PASSED** |
| 8 | `tests/test_pedidos.py` | `test_compra_sin_sesion_401` | Intento de compra sin token de autenticación (401 Unauthorized). | 🟢 **PASSED** |
| 9 | `tests/test_arrepentimiento.py` | `test_arrepentimiento_sin_sesion` | Ejercicio del botón de arrepentimiento sin sesión (201 con código `ARR-` y restitución inmediata del stock). | 🟢 **PASSED** |
| 10 | `tests/test_arrepentimiento.py` | `test_arrepentimiento_id_inexistente` | Solicitud de arrepentimiento con ID inexistente sin divulgar datos ni estado sensible (201 anti-enumeración). | 🟢 **PASSED** |
| 11 | `tests/test_imagen.py` | `test_archivo_trampa_por_admin_415` | Archivo trampa (.txt renombrado a .png) subido por admin es rechazado por magic bytes (415). | 🟢 **PASSED** |
| 12 | `tests/test_imagen.py` | `test_archivo_trampa_subido_por_cliente_403` | Intento de subida de imagen por un usuario cliente denegado por autorización (403 Forbidden). | 🟢 **PASSED** |
| 13 | `tests/test_imagen.py` | `test_subida_imagen_sin_sesion_401` | Intento de subida de archivo multimedia sin sesión activa (401 Unauthorized). | 🟢 **PASSED** |

---

### Configuración de Testing

- **Archivo `pytest.ini`:**
  ```ini
  [pytest]
  testpaths = tests
  pythonpath = .
  ```
- **Base de datos de prueba:** SQLite en memoria con `StaticPool` (`sqlite://`), garantizando transacciones atómicas, aislamiento por test y máxima velocidad sin alterar los datos productivos.
