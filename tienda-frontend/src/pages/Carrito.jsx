import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { useAuth } from "../context/AuthContext";
import { crearPedido } from "../services/api";

export default function Carrito() {
  const { items, quitar, vaciar, total } = useCarrito();
  const { estaAutenticado } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(valor);
  };

  const confirmar = async () => {
    // Protección estricta contra múltiples clics
    if (enviando) return;

    if (!estaAutenticado) {
      navigate("/login?redirect=/carrito");
      return;
    }

    setError(null);
    setEnviando(true);

    try {
      await crearPedido(items);
      vaciar();
      navigate("/mis-pedidos");
    } catch (err) {
      console.error("Error al confirmar el pedido:", err);
      setError(err.message || "Error al procesar la compra.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="cart-page-container" style={{ maxWidth: "850px", margin: "2rem auto", padding: "1.5rem" }}>
      <h2 className="section-title">Tu Carrito de Compras</h2>

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", background: "#fff", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          <p style={{ fontSize: "1.2rem", color: "var(--color-text-light)", marginBottom: "1.5rem" }}>
            Tu carrito está vacío actualmente.
          </p>
          <Link to="/" className="btn" style={{ textDecoration: "none", display: "inline-block", width: "auto", padding: "0.75rem 2rem" }}>
            Explorar Delicias
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "1.5rem", boxShadow: "0 4px 15px rgba(0,0,0,0.05)" }}>
          <div className="cart-items-list">
            {items.map((item) => {
              const prod = item.producto;
              const subtotal = (Number(prod.precio_final) || 0) * item.cantidad;
              return (
                <div
                  key={prod.id}
                  className="cart-row"
                  id={`cart-row-${prod.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontFamily: "var(--font-title)" }}>{prod.nombre}</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-light)" }}>
                      {formatearMoneda(prod.precio_final)} x {item.cantidad} unidad{item.cantidad > 1 ? "es" : ""}
                    </p>
                  </div>

                  <div style={{ flex: 1, textAlign: "right", fontWeight: "600" }}>
                    {formatearMoneda(subtotal)}
                  </div>

                  <div style={{ flex: 1, textAlign: "right" }}>
                    <button
                      onClick={() => quitar(prod.id)}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 0.8rem", width: "auto", fontSize: "0.85rem" }}
                      id={`btn-quitar-${prod.id}`}
                      title="Quitar del carrito"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total calculado */}
          <div
            className="cart-total-section"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.5rem",
              paddingTop: "1.5rem",
              borderTop: "2px solid var(--color-border)",
            }}
          >
            <span style={{ fontSize: "1.3rem", fontWeight: "700" }}>Total:</span>
            <span id="cart-total-amount" style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-primary)" }}>
              {formatearMoneda(total)}
            </span>
          </div>

          {/* Mensajes de Error */}
          {error && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.8rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#fff0f2",
                color: "var(--color-error)",
                border: "1px solid #f8d7da",
              }}
              role="alert"
              id="checkout-error-msg"
            >
              ⚠️ {error}
            </div>
          )}

          {/* Botones de acción */}
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              onClick={vaciar}
              className="btn btn-secondary"
              style={{ width: "auto", padding: "0.75rem 1.5rem" }}
              disabled={enviando}
              id="btn-vaciar-carrito"
            >
              Vaciar Carrito
            </button>

            <button
              onClick={confirmar}
              className="btn"
              style={{ width: "auto", minWidth: "220px", padding: "0.75rem 2rem" }}
              disabled={enviando}
              id="btn-confirmar-pedido"
            >
              {enviando ? "Confirmando…" : "Confirmar Compra"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
