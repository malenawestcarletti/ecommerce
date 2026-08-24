import React, { useState, useEffect } from "react";
import { getProductos } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Catalogo({ productos: propProductos, setProductos: propSetProductos }) {
  const [localProductos, setLocalProductos] = useState([]);

  // Si se pasan por props (estado compartido), los usamos; si no, manejamos estado local
  const isShared = propProductos !== undefined;
  const productos = isShared ? propProductos : localProductos;
  const setProductos = isShared ? propSetProductos : setLocalProductos;

  useEffect(() => {
    // Si no es compartido, hacemos el fetch en el montaje
    if (!isShared) {
      getProductos()
        .then(setProductos)
        .catch((err) => console.error("Error cargando productos en Catalogo:", err));
    }
  }, [isShared]);

  return (
    <section id="catalogo">
      <h2 className="section-title">Nuestras Delicias</h2>
      <div className="products-grid">
        {productos.length > 0 ? (
          productos.map((prod) => (
            <ProductCard key={prod.id} producto={prod} />
          ))
        ) : (
          <p style={{ fontStyle: "italic", color: "var(--color-text-light)" }}>
            No hay productos disponibles en este momento.
          </p>
        )}
      </div>
    </section>
  );
}
