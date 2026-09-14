const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Encabezados con token de autenticación desde localStorage
 */
export function authHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Manejo centralizado de respuestas HTTP:
 * - 401 traducido ("sesión vencida")
 * - 409 mostrando el detail directo del backend
 * - 404 informando recurso inexistente
 * - Mensaje genérico para el resto
 */
export async function manejarRespuesta(res) {
  if (res.ok) {
    if (res.status === 204) return null;
    return res.json();
  }

  let errorDetail = "";
  try {
    const errorJson = await res.json();
    errorDetail = errorJson.detail || "";
  } catch {
    errorDetail = "";
  }

  if (res.status === 401) {
    throw new Error(
      errorDetail || "Tu sesión ha vencido. Por favor, volvé a iniciar sesión."
    );
  } else if (res.status === 409) {
    throw new Error(errorDetail || "Conflicto al procesar la solicitud con el estado actual.");
  } else if (res.status === 404) {
    throw new Error(errorDetail || "El recurso solicitado no fue encontrado.");
  } else {
    throw new Error(errorDetail || "Ocurrió un error inesperado al comunicarse con el servidor.");
  }
}

/**
 * Información de bienvenida y marco legal (Ley 24.240 y Disposición 954/2025)
 */
export async function getWelcomeInfo() {
  const response = await fetch(`${API_URL}/`);
  return manejarRespuesta(response);
}

/**
 * Catálogo de productos con paginación y búsqueda
 */
export async function getProductos({ page = 0, limit = 6, nombre = "" } = {}) {
  const params = new URLSearchParams({ skip: page * limit, limit });
  if (nombre) params.append("nombre", nombre);

  const respuesta = await fetch(`${API_URL}/productos?${params}`);
  return manejarRespuesta(respuesta);
}

/**
 * Registro de nuevo producto (Panel Admin)
 */
export async function createProducto(productoData) {
  const response = await fetch(`${API_URL}/productos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productoData),
  });
  return manejarRespuesta(response);
}

/**
 * Confirmar Pedido (Checkout).
 * Envía el cuerpo formateado con solo producto_id y cantidad:
 * { "items": [ {"producto_id": 3, "cantidad": 2} ] }
 */
export async function crearPedido(items) {
  const payload = {
    items: items.map((item) => ({
      producto_id: item.producto_id || item.producto?.id || item.id,
      cantidad: item.cantidad,
    })),
  };

  const response = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  return manejarRespuesta(response);
}

/**
 * Obtener historial de pedidos del usuario autenticado
 */
export async function getMisPedidos() {
  const response = await fetch(`${API_URL}/pedidos/mios`, {
    headers: authHeaders(),
  });
  return manejarRespuesta(response);
}

/**
 * Ejercer el derecho de arrepentimiento (revocar pedido)
 */
export async function revocarPedido(pedidoId) {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/revocacion`, {
    method: "POST",
    headers: authHeaders(),
  });
  return manejarRespuesta(response);
}

/**
 * Obtener todos los datos personales y contractuales (Derechos ARCO)
 */
export async function getMisDatos() {
  const response = await fetch(`${API_URL}/usuarios/me/datos`, {
    headers: authHeaders(),
  });
  return manejarRespuesta(response);
}

/**
 * Descarga de archivo de portabilidad JSON usando fetch, blob y link temporal
 */
export async function exportarMisDatos() {
  const response = await fetch(`${API_URL}/usuarios/me/exportar`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    return manejarRespuesta(response);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mis_datos_dulce_vicio.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Solicitar eliminación y anonimización de la cuenta
 */
export async function eliminarMiCuenta() {
  const response = await fetch(`${API_URL}/usuarios/me`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return manejarRespuesta(response);
}

/**
 * Iniciar sesión
 */
export async function loginUsuario(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return manejarRespuesta(response);
}

/**
 * Registrar nuevo usuario con consentimiento
 */
export async function registrarUsuario(datos) {
  const response = await fetch(`${API_URL}/auth/registro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  return manejarRespuesta(response);
}

/**
 * Obtener perfil actual autenticado
 */
export async function getPerfilActual() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });
  return manejarRespuesta(response);
}
