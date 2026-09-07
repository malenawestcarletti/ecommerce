const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Obtiene el mensaje de bienvenida y el marco legal (Ley 24.240) del root.
 */
export async function getWelcomeInfo() {
  const response = await fetch(`${API_URL}/`);
  if (!response.ok) {
    throw new Error("No se pudo obtener la información general de la API.");
  }
  return response.json();
}

/**
 * Obtiene la lista de productos con paginación y filtro por nombre.
 */
export async function getProductos({ page = 0, limit = 6, nombre = "" } = {}) {
  const params = new URLSearchParams({ skip: page * limit, limit });
  if (nombre) params.append("nombre", nombre);

  const respuesta = await fetch(`${API_URL}/productos?${params}`);
  if (!respuesta.ok) throw new Error("Error al consultar el backend");
  return respuesta.json();
}

/**
 * Registra un nuevo producto en la tienda.
 */
export async function createProducto(productoData) {
  const response = await fetch(`${API_URL}/productos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productoData),
  });
  if (!response.ok) {
    throw new Error("Error al registrar el producto. Por favor, revisá los campos.");
  }
  return response.json();
}

/**
 * Registra un nuevo pedido (checkout).
 */
export async function crearPedido(pedidoData) {
  const response = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(pedidoData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al realizar la compra. Verifique el stock.");
  }
  return response.json();
}

/**
 * Cancela un pedido realizado.
 */
export async function cancelarPedido(pedidoId) {
  const response = await fetch(`${API_URL}/pedidos/${pedidoId}/cancelar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    }
  });
  if (!response.ok) {
    throw new Error("Error al intentar cancelar el pedido.");
  }
  return response.json();
}
