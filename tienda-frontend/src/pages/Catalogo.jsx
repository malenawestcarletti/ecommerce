import React, { useState, useEffect } from "react";
import { getProductos } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Catalogo({ onAddToCart }) {
  const [productos, setProductos] = useState([]);
  const [page, setPage] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [lento, setLento] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cargando) {
      setLento(false);
      return;
    }
    const t = setTimeout(() => setLento(true), 5000);
    return () => clearTimeout(t);
  }, [cargando]);

  useEffect(() => {
    setCargando(true);
    setError(null);
    getProductos({ page, nombre: busqueda })
      .then((data) => {
        setProductos(data);
      })
      .catch((err) => {
        console.error("Error al consultar el backend:", err);
        setError("Error al consultar el backend");
      })
      .finally(() => {
        setCargando(false);
      });
  }, [page, busqueda]);

  const handleProductUpdated = (updated) => {
    setProductos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  return (
    <section id="catalogo">
      <h2 className="section-title">Nuestras Delicias</h2>

      <div className="filters-bar" style={{ justifyContent: "center", marginBottom: "1.5rem" }}>
        <input
          type="text"
          className="filter-input"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => {
            setPage(0);
            setBusqueda(e.target.value);
          }}
          style={{ maxWidth: "400px" }}
        />
      </div>

      {cargando && (
        <p role="status" style={{ fontStyle: "italic", color: "var(--color-text-light)", textAlign: "center" }}>
          {lento ? "Despertando el servidor, la primera visita puede tardar un minuto…" : "Cargando productos…"}
        </p>
      )}

      {error && !cargando && (
        <p style={{ color: "red", fontWeight: "bold", textAlign: "center" }}>
          {error}
        </p>
      )}

      {!cargando && !error && (
        <div className="products-grid">
          {productos.length > 0 ? (
            productos.map((prod) => (
              <ProductCard
                key={prod.id}
                producto={prod}
                onAddToCart={onAddToCart}
                onProductUpdated={handleProductUpdated}
              />
            ))
          ) : (

            <p style={{ fontStyle: "italic", color: "var(--color-text-light)", gridColumn: "1 / -1", textAlign: "center" }}>
              No hay productos disponibles en este momento.
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "2rem" }}>
        <button
          className="btn btn-secondary"
          style={{ width: "auto", padding: "0.5rem 1.5rem" }}
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>

        <span style={{ fontWeight: "600", color: "var(--color-text)" }}>
          Página {page + 1}
        </span>

        <button
          className="btn btn-secondary"
          style={{ width: "auto", padding: "0.5rem 1.5rem" }}
          onClick={() => setPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}