const API_URL = "/api";

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
 * Obtiene la lista completa de productos con paginación y filtros opcionales.
 */
export async function getProductos(skip = 0, limit = 100, nombre = "", precioMax = "") {
  let url = `${API_URL}/productos?skip=${skip}&limit=${limit}`;
  if (nombre) {
    url += `&nombre=${encodeURIComponent(nombre)}`;
  }
  if (precioMax) {
    url += `&precio_max=${encodeURIComponent(precioMax)}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error al obtener la lista de productos.");
  }
  return response.json();
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
