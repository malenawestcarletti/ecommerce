import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [esRegistro, setEsRegistro] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consentimiento, setConsentimiento] = useState(true);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const { login, registro } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const redirectPath = queryParams.get("redirect") || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      if (esRegistro) {
        if (!nombre.trim()) {
          throw new Error("Por favor, ingresá tu nombre completo.");
        }
        if (!consentimiento) {
          throw new Error("Debés otorgar tu consentimiento para crear la cuenta.");
        }
        await registro({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          password,
          consentimiento: true,
        });
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      navigate(redirectPath);
    } catch (err) {
      console.error("Error de autenticación:", err);
      setError(err.message || "Error al procesar la solicitud.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ maxWidth: "480px", margin: "3rem auto", padding: "2rem", background: "#fff", borderRadius: "16px", border: "1px solid var(--color-border)", boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", borderBottom: "2px solid var(--color-border)", marginBottom: "1.5rem" }}>
        <button
          type="button"
          onClick={() => {
            setEsRegistro(false);
            setError(null);
          }}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "none",
            border: "none",
            borderBottom: !esRegistro ? "3px solid var(--color-primary)" : "none",
            fontWeight: !esRegistro ? "700" : "500",
            color: !esRegistro ? "var(--color-primary)" : "var(--color-text-light)",
            cursor: "pointer",
            fontSize: "1rem",
          }}
          id="tab-login"
        >
          Iniciar Sesión
        </button>

        <button
          type="button"
          onClick={() => {
            setEsRegistro(true);
            setError(null);
          }}
          style={{
            flex: 1,
            padding: "0.75rem",
            background: "none",
            border: "none",
            borderBottom: esRegistro ? "3px solid var(--color-primary)" : "none",
            fontWeight: esRegistro ? "700" : "500",
            color: esRegistro ? "var(--color-primary)" : "var(--color-text-light)",
            cursor: "pointer",
            fontSize: "1rem",
          }}
          id="tab-registro"
        >
          Crear Cuenta
        </button>
      </div>

      <h3 style={{ fontFamily: "var(--font-title)", textAlign: "center", marginBottom: "1.5rem" }}>
        {esRegistro ? "Registro de Consumidor/a" : "Bienvenido/a a Dulce Vicio"}
      </h3>

      {error && (
        <div style={{ backgroundColor: "#fce8e6", border: "1px solid #d93025", borderRadius: "8px", padding: "0.8rem", color: "#c5221f", marginBottom: "1.2rem", fontSize: "0.9rem" }} role="alert">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {esRegistro && (
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label" htmlFor="input-auth-nombre">Nombre y Apellido *</label>
            <input
              id="input-auth-nombre"
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Martín García"
              required
            />
          </div>
        )}

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label" htmlFor="input-auth-email">Correo Electrónico *</label>
          <input
            id="input-auth-email"
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ej. martin@ejemplo.com"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label" htmlFor="input-auth-password">Contraseña *</label>
          <input
            id="input-auth-password"
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Tu contraseña segura"
            required
          />
        </div>

        {esRegistro && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--color-text)" }}>
            <input
              id="check-consentimiento"
              type="checkbox"
              checked={consentimiento}
              onChange={(e) => setConsentimiento(e.target.checked)}
              required
              style={{ marginTop: "0.2rem" }}
            />
            <label htmlFor="check-consentimiento" style={{ cursor: "pointer" }}>
              Otorgo mi <strong>consentimiento informado</strong> para el tratamiento de mis datos personales y acepto los términos conforme a la Ley N° 25.326 y Ley N° 24.240.
            </label>
          </div>
        )}

        <button
          type="submit"
          className="btn"
          disabled={cargando}
          id="btn-submit-auth"
          style={{ width: "100%", padding: "0.8rem", marginTop: "0.5rem" }}
        >
          {cargando ? "Procesando…" : esRegistro ? "Registrarme y Aceptar" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
