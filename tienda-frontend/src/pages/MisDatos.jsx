import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMisDatos, exportarMisDatos, eliminarMiCuenta } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCarrito } from "../context/CarritoContext";

export default function MisDatos() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para exportación
  const [exportando, setExportando] = useState(false);

  // Estados para baja de cuenta
  const [confirmarPalabra, setConfirmarPalabra] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [errorBaja, setErrorBaja] = useState(null);

  const { logout } = useAuth();
  const { vaciar } = useCarrito();
  const navigate = useNavigate();

  const cargarDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMisDatos();
      setDatos(data);
    } catch (err) {
      console.error("Error al obtener datos:", err);
      setError(err.message || "No se pudieron cargar tus datos personales.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleExportar = async () => {
    setExportando(true);
    try {
      await exportarMisDatos();
    } catch (err) {
      alert("Error al descargar tus datos: " + err.message);
    } finally {
      setExportando(false);
    }
  };

  const handleEliminarCuenta = async (e) => {
    e.preventDefault();
    if (confirmarPalabra.trim() !== "ELIMINAR") return;

    setEliminando(true);
    setErrorBaja(null);

    try {
      await eliminarMiCuenta();
      // 1. Vaciar carrito
      vaciar();
      // 2. Cerrar sesión
      logout();
      // 3. Navegar a portada con mensaje informativo
      navigate("/", {
        state: {
          mensajeExito: "Tu cuenta ha sido eliminada y tus datos han sido anonimizados correctamente conforme a la ley.",
        },
      });
    } catch (err) {
      console.error("Error al eliminar cuenta:", err);
      setErrorBaja(err.message || "No se pudo completar la baja de la cuenta.");
      setEliminando(false);
    }
  };

  // ESTADO 1: Cargando
  if (cargando) {
    return (
      <div id="mis-datos-cargando" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 1s infinite linear" }}></div>
        <p style={{ fontFamily: "var(--font-title)", color: "var(--color-text-light)" }}>
          Recopilando tus datos personales y contractuales...
        </p>
      </div>
    );
  }

  // ESTADO 2: Error
  if (error || !datos) {
    return (
      <div id="mis-datos-error" style={{ maxWidth: "600px", margin: "3rem auto", padding: "2rem", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid var(--color-error)" }}>
        <h3 style={{ color: "var(--color-error)", marginBottom: "1rem" }}>Error al cargar tus datos</h3>
        <p style={{ color: "var(--color-text)", marginBottom: "1.5rem" }}>{error}</p>
        <button onClick={cargarDatos} className="btn" style={{ width: "auto", padding: "0.6rem 2rem" }}>
          Reintentar
        </button>
      </div>
    );
  }

  // ESTADO 3: Visualización completa de datos (sin filtrar nada)
  const usr = datos.usuario || {};
  const pedidos = datos.pedidos || [];
  const solicitudes = datos.solicitudes_revocacion || [];
  const fechaConsentimiento = datos.fecha_consentimiento || usr.fecha_consentimiento;

  return (
    <div className="mis-datos-container" style={{ maxWidth: "900px", margin: "2rem auto", padding: "1.5rem" }}>
      <h2 className="section-title">Mis Datos y Derechos ARCO</h2>
      <p style={{ textAlign: "center", color: "var(--color-text-light)", marginBottom: "2rem" }}>
        Garantizamos el acceso, rectificación, actualización y supresión de tus datos personales conforme a la Ley de Protección de Datos Personales N° 25.326.
      </p>

      {/* Tarjeta de Información Personal y Consentimiento */}
      <div
        className="datos-card"
        id="panel-datos-usuario"
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1px solid var(--color-border)",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ fontFamily: "var(--font-title)", color: "var(--color-primary)", marginTop: 0, borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
          📋 Datos de Perfil y Registro
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-light)", display: "block" }}>Identificador Único (ID)</span>
            <strong>#{usr.id}</strong>
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-light)", display: "block" }}>Nombre Completo</span>
            <strong>{usr.nombre || "No especificado"}</strong>
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-light)", display: "block" }}>Correo Electrónico</span>
            <strong>{usr.email}</strong>
          </div>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-light)", display: "block" }}>Rol de Usuario</span>
            <strong>{usr.rol}</strong>
          </div>
        </div>

        {/* Fecha del consentimiento destacada (Entregable 2) */}
        <div
          id="bloque-fecha-consentimiento"
          style={{
            marginTop: "1.5rem",
            padding: "1.2rem",
            background: "var(--bg-secondary)",
            borderRadius: "10px",
            borderLeft: "4px solid var(--color-success)",
          }}
        >
          <span style={{ fontSize: "0.9rem", color: "var(--color-text)", fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
            🛡️ Consentimiento Legal Informado
          </span>
          <p style={{ margin: "0.25rem 0", fontSize: "0.95rem" }}>
            Fecha y hora exacta en que otorgaste tu consentimiento:
          </p>
          <strong
            id="fecha-consentimiento-valor"
            style={{ fontSize: "1.1rem", color: "var(--color-text)", fontFamily: "monospace" }}
          >
            {fechaConsentimiento
              ? new Date(fechaConsentimiento).toLocaleString("es-AR", { dateStyle: "full", timeStyle: "long" })
              : "Registrado al momento de la creación de la cuenta"}
          </strong>
        </div>

        {/* Botón de Portabilidad y Descarga de Datos */}
        <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <strong>Derecho a la Portabilidad:</strong>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--color-text-light)" }}>
              Podés descargar una copia íntegra de tus datos personales en formato JSON estándar.
            </p>
          </div>
          <button
            onClick={handleExportar}
            disabled={exportando}
            className="btn btn-secondary"
            id="btn-exportar-datos"
            style={{ width: "auto", padding: "0.6rem 1.5rem" }}
          >
            {exportando ? "Descargando..." : "📥 Descargar Mis Datos (JSON)"}
          </button>
        </div>
      </div>

      {/* Historial de Pedidos registrados */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1px solid var(--color-border)",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ fontFamily: "var(--font-title)", color: "var(--color-primary)", marginTop: 0 }}>
          📦 Pedidos Registrados ({pedidos.length})
        </h3>
        {pedidos.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "var(--color-text-light)" }}>No tenés pedidos registrados.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {pedidos.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "0.8rem",
                  background: "var(--bg-primary)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.9rem",
                }}
              >
                <span>Pedido #{p.id} ({new Date(p.creado_en).toLocaleDateString("es-AR")})</span>
                <span>Estado: <strong>{p.estado}</strong> | Total: ${p.total}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Solicitudes de Revocación registradas */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1px solid var(--color-border)",
          padding: "2rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        <h3 style={{ fontFamily: "var(--font-title)", color: "var(--color-primary)", marginTop: 0 }}>
          📄 Solicitudes de Arrepentimiento Registradas ({solicitudes.length})
        </h3>
        {solicitudes.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "var(--color-text-light)" }}>No has emitido solicitudes de revocación.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {solicitudes.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "0.8rem",
                  background: "#e6f4ea",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.9rem",
                }}
              >
                <span>Código: <strong style={{ fontFamily: "monospace" }}>{s.codigo}</strong> (Pedido #{s.pedido_id})</span>
                <span>{new Date(s.creada_en).toLocaleString("es-AR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN OBLIGATORIA: ELIMINAR MI CUENTA (Con su propio título y separada del resto) */}
      <div
        className="danger-zone"
        id="seccion-eliminar-cuenta"
        style={{
          background: "#fff",
          borderRadius: "14px",
          border: "2px solid var(--color-error)",
          padding: "2rem",
          boxShadow: "0 4px 15px rgba(224, 86, 36, 0.08)",
        }}
      >
        <h3 style={{ color: "var(--color-error)", margin: "0 0 1rem 0", fontFamily: "var(--font-title)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠️</span> Eliminar mi cuenta
        </h3>

        {/* Explicación previa obligatoria: qué se borra y qué queda */}
        <div
          style={{
            backgroundColor: "#fff5f5",
            padding: "1.2rem",
            borderRadius: "8px",
            border: "1px solid #fed7d7",
            marginBottom: "1.5rem",
            fontSize: "0.95rem",
            lineHeight: "1.6",
          }}
        >
          <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "#c53030" }}>
            ¿Qué sucede al confirmar la eliminación de tu cuenta?
          </p>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", color: "#4a5568" }}>
            <li style={{ marginBottom: "0.35rem" }}>
              <strong>Lo que se elimina:</strong> Tu nombre completo, correo electrónico y contraseña hasheada serán borrados permanentemente y reemplazados por valores anónimos no identificables.
            </li>
            <li style={{ marginBottom: "0.35rem" }}>
              <strong>Lo que se conserva:</strong> Los pedidos y registros fiscales ya realizados se preservan disociados para control contable y de stock, pero sin ningún dato que permita identificarte directa ni indirectamente.
            </li>
            <li>
              <strong>Tu sesión:</strong> Será cerrada de inmediato e invalidada en todos tus dispositivos.
            </li>
          </ul>
        </div>

        {errorBaja && (
          <div style={{ color: "var(--color-error)", marginBottom: "1rem", fontWeight: "500" }}>
            ⚠️ {errorBaja}
          </div>
        )}

        <form onSubmit={handleEliminarCuenta} style={{ maxWidth: "500px" }}>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label htmlFor="input-confirmar-eliminar" className="form-label" style={{ fontSize: "0.9rem" }}>
              Para confirmar, escribí exactamente la palabra <strong>ELIMINAR</strong> en mayúsculas:
            </label>
            <input
              id="input-confirmar-eliminar"
              type="text"
              className="form-input"
              value={confirmarPalabra}
              onChange={(e) => setConfirmarPalabra(e.target.value)}
              placeholder="Escribí ELIMINAR acá"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-secondary"
            disabled={confirmarPalabra.trim() !== "ELIMINAR" || eliminando}
            id="btn-confirmar-baja"
            style={{
              backgroundColor: confirmarPalabra.trim() === "ELIMINAR" ? "var(--color-error)" : "#ccc",
              color: "#fff",
              borderColor: confirmarPalabra.trim() === "ELIMINAR" ? "var(--color-error)" : "#ccc",
              cursor: confirmarPalabra.trim() === "ELIMINAR" ? "pointer" : "not-allowed",
              padding: "0.75rem 2rem",
              width: "auto",
            }}
          >
            {eliminando ? "Eliminando cuenta..." : "Eliminar Definitivamente Mi Cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
