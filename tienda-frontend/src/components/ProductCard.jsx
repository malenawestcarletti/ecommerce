import React, { useState } from "react";
import { useCarrito } from "../context/CarritoContext";
import { useAuth } from "../context/AuthContext";
import { urlImagen } from "../utils/imagenes";
import SubirImagen from "./SubirImagen";

export default function ProductCard({ producto, onAddToCart, onProductUpdated }) {
  const { agregar } = useCarrito();
  const { usuario } = useAuth();
  const [agregado, setAgregado] = useState(false);
  const [mostrarSubida, setMostrarSubida] = useState(false);

  const esAdmin = usuario?.rol === "admin";
  const imgSrc = urlImagen(producto);

  // Helper para dar formato de moneda argentina
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(valor);
  };

  const handleAgregar = () => {
    if (onAddToCart) {
      onAddToCart(producto);
    } else {
      agregar(producto, 1);
    }
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1200);
  };

  const handleImagenSubida = (productoActualizado) => {
    setMostrarSubida(false);
    if (onProductUpdated) {
      onProductUpdated(productoActualizado);
    }
  };

  return (
    <article className="product-card" id={`product-card-${producto.id}`}>
      {/* Contenedor de aspecto cuadrado (aspect-square) para evitar desalineaciones en la grilla */}
      <div className="aspect-square product-image-container">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={producto.nombre}
            loading="lazy"
            className="object-cover product-image"
          />
        ) : (
          <div className="placeholder-content" role="img" aria-label={`Sin imagen de ${producto.nombre}`}>
            <span className="placeholder-icon">📷</span>
            <span className="placeholder-text">Sin imagen</span>
          </div>
        )}


        {/* Badge para Admin para gestionar foto */}
        {esAdmin && (
          <button
            type="button"
            className="admin-edit-image-badge"
            onClick={() => setMostrarSubida(!mostrarSubida)}
            title="Actualizar imagen del producto (Admin)"
            id={`btn-toggle-subir-${producto.id}`}
          >
            📷 {imgSrc ? "Cambiar" : "Cargar"}
          </button>
        )}
      </div>

      <div className="product-info">
        <h3 className="product-name">{producto.nombre}</h3>
        <p className="product-price">{formatearMoneda(producto.precio_final)}</p>

        {producto.cuotas_cantidad > 1 ? (
          <p className="product-installments">
            {producto.cuotas_cantidad} cuotas sin interés de {formatearMoneda(producto.cuotas_valor)}
          </p>
        ) : (
          <p className="product-installments" style={{ color: "var(--color-text-light)" }}>
            Pago único
          </p>
        )}

        <div className="product-meta">
          <span>
            Garantía: {producto.garantia_meses > 0 ? `${producto.garantia_meses} meses` : "Frescura artesanal"}
          </span>
          <span className={`stock-tag ${producto.stock > 0 ? "in-stock" : "out-stock"}`}>
            {producto.stock > 0 ? `${producto.stock} disp.` : "Sin Stock"}
          </span>
        </div>

        <button
          className="btn btn-secondary"
          style={{
            marginTop: "1rem",
            width: "100%",
            backgroundColor: agregado ? "var(--color-success)" : undefined,
            color: agregado ? "#fff" : undefined,
            borderColor: agregado ? "var(--color-success)" : undefined,
            transition: "all 0.2s ease",
          }}
          id={`btn-add-cart-${producto.id}`}
          onClick={handleAgregar}
          disabled={producto.stock <= 0}
        >
          {producto.stock <= 0 ? "Sin Stock" : agregado ? "¡Agregado! ✓" : "Agregar al carrito"}
        </button>

        {/* Panel desplegable de subida para administradores */}
        {esAdmin && mostrarSubida && (
          <SubirImagen
            productoId={producto.id}
            onSuccess={handleImagenSubida}
            onCancel={() => setMostrarSubida(false)}
          />
        )}
      </div>
    </article>
  );
}
