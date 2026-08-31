import React, { useState, useEffect } from "react";
import { getProductos } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Catalogo({ productos: propProductos, setProductos: propSetProductos, onAddToCart }) {
  const [localProductos, setLocalProductos] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isShared = propProductos !== undefined;
  const productos = isShared ? propProductos : localProductos;
  const setProductos = isShared ? propSetProductos : setLocalProductos;

  useEffect(() => {
    if (!isShared) {
      setIsLoading(true);
      setError(null);

      getProductos()
        .then((data) => setProductos(data))
        .catch((err) => {
          console.error("Error cargando productos en Catalogo:", err);
          setError("No pudimos cargar los productos.");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [isShared]);

  return (
    <section id="catalogo">
      <h2 className="section-title">Nuestras Delicias</h2>

      {isLoading && (
        <p style={{ fontStyle: "italic", color: "var(--color-text-light)" }}>
          Cargando productos...
        </p>
      )}

      {error && !isLoading && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <div className="products-grid">
          {productos.length > 0 ? (
            productos.map((prod) => (
              <ProductCard key={prod.id} producto={prod} onAddToCart={onAddToCart} />
            ))
          ) : (
            <p style={{ fontStyle: "italic", color: "var(--color-text-light)" }}>
              No hay productos disponibles en este momento.
            </p>
          )}
        </div>
      )}
    </section>
  );
}