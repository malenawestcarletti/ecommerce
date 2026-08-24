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
 * Obtiene la lista completa de productos.
 */
export async function getProductos() {
  const response = await fetch(`${API_URL}/productos`);
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
