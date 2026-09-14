import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Arrepentimiento() {
  const { estaAutenticado, usuario } = useAuth();

  return (
    <div
      className="arrepentimiento-container"
      style={{
        maxWidth: "800px",
        margin: "3rem auto",
        padding: "2rem",
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid var(--color-border)",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <span style={{ fontSize: "3rem" }}>⚖️</span>
        <h2 style={{ fontFamily: "var(--font-title)", fontSize: "2rem", color: "var(--color-text)", marginTop: "0.5rem" }}>
          Derecho de Arrepentimiento
        </h2>
        <p style={{ color: "var(--color-text-light)", fontSize: "1rem" }}>
          Cumplimiento Ley N° 24.240 (Art. 34) y Disposición N° 954/2025 de la República Argentina
        </p>
      </div>

      <div style={{ lineHeight: "1.7", color: "var(--color-text)", fontSize: "1.05rem" }}>
        <div
          style={{
            backgroundColor: "var(--bg-secondary)",
            padding: "1.5rem",
            borderRadius: "12px",
            borderLeft: "5px solid var(--color-primary)",
            marginBottom: "1.5rem",
          }}
        >
          <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--color-primary)", fontFamily: "var(--font-title)" }}>
            ¿En qué consiste este derecho?
          </h3>
          <p style={{ margin: 0 }}>
            Si realizaste una compra en nuestra tienda online, tenés derecho a <strong>revocar tu aceptación</strong> dentro del plazo de <strong>10 (diez) días corridos</strong> contados a partir de la fecha en que se entregó el producto o se celebró el contrato.
          </p>
        </div>

        <h4 style={{ fontFamily: "var(--font-title)", fontSize: "1.2rem", marginTop: "1.5rem", marginBottom: "0.75rem" }}>
          Tus garantías legales como consumidor:
        </h4>
        <ul style={{ paddingLeft: "1.5rem", marginBottom: "2rem" }}>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Sin costo alguno:</strong> El trámite de arrepentimiento y cancelación es 100% gratuito. No genera comisiones ni cargos administrativos.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Sin justificar nada:</strong> No estás obligado/a a dar explicaciones ni motivos para ejercer tu arrepentimiento.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Gastos a cargo del vendedor:</strong> Todos los gastos de devolución o retiro del producto corren exclusivamente por cuenta de Pastelería Dulce Vicio.
          </li>
          <li style={{ marginBottom: "0.5rem" }}>
            <strong>Constancia inmediata:</strong> Al solicitarlo, el sistema te entregará automáticamente un código identificatorio único para tu seguimiento y resguardo.
          </li>
        </ul>

        {/* Acciones según si hay sesión iniciada o no */}
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            background: "#fafafa",
            borderRadius: "12px",
            border: "1px dashed var(--color-border)",
            marginTop: "2rem",
          }}
        >
          {estaAutenticado ? (
            <div>
              <p style={{ marginBottom: "1rem", fontWeight: "600" }}>
                Hola, {usuario?.nombre || "Comprador/a"}. Para revocar una de tus compras recientes, ingresá directamente a tu historial:
              </p>
              <Link
                to="/mis-pedidos"
                className="btn"
                id="btn-ir-historial"
                style={{
                  textDecoration: "none",
                  display: "inline-block",
                  width: "auto",
                  padding: "0.8rem 2.5rem",
                }}
              >
                Ir a Mis Pedidos y Revocar Compra
              </Link>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: "1rem", fontWeight: "600" }}>
                Para ejercer tu derecho de arrepentimiento sobre un pedido realizado, por favor iniciá sesión en tu cuenta:
              </p>
              <Link
                to="/login?redirect=/mis-pedidos"
                className="btn"
                id="btn-login-arrepentimiento"
                style={{
                  textDecoration: "none",
                  display: "inline-block",
                  width: "auto",
                  padding: "0.8rem 2.5rem",
                }}
              >
                Iniciar Sesión para Ejercer el Derecho
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
