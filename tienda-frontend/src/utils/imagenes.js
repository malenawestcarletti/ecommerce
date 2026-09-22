// src/utils/imagenes.js

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Retorna la URL completa para mostrar la imagen de un producto.
 * Si producto.imagen_url es null o indefinido, retorna null.
 * En caso contrario, concatena VITE_API_URL con la ruta relativa de la imagen.
 *
 * @param {Object} producto - Objeto del producto con la propiedad imagen_url
 * @returns {string|null} URL completa de la imagen o null si no posee
 */
export function urlImagen(producto) {
  if (!producto || !producto.imagen_url) {
    return null;
  }

  const imagenUrl = producto.imagen_url.trim();
  if (!imagenUrl) {
    return null;
  }

  // Si ya es una URL absoluta (http:// o https://)
  if (imagenUrl.startsWith("http://") || imagenUrl.startsWith("https://")) {
    return imagenUrl;
  }

  // Quita barra final de API_URL si existiera y asegura barra inicial en imagenUrl
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const path = imagenUrl.startsWith("/") ? imagenUrl : `/${imagenUrl}`;

  return `${base}${path}`;
}
