import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMisPedidos, revocarPedido } from "../services/api";

const DIAS_PARA_REVOCAR = 10;

function puedeRevocar(pedido) {
  if (pedido.estado === "cancelado") return false;
  const fechaStr = pedido.creado_en || pedido.fecha;
  if (!fechaStr) return false;
  const ms = Date.now() - new Date(fechaStr).getTime();
  return ms / 86400000 <= DIAS_PARA_REVOCAR;
}

export default function MisPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para revocación
  const [revocandoId, setRevocandoId] = useState(null);
  const [codigoRevocacion, setCodigoRevocacion] = useState(null);
  const [errorRevocacion, setErrorRevocacion] = useState(null);

  const cargarHistorial = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMisPedidos();
      setPedidos(data || []);
    } catch (err) {
      console.error("Error al cargar historial:", err);
      setError(err.message || "No se pudo cargar el historial de compras.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(valor);
  };

  const handleRevocar = async (pedidoId) => {
    if (revocandoId) return;

    const confirmacion = window.confirm(
      `¿Estás seguro/a de revocar el Pedido #${pedidoId}? De acuerdo con el Art. 34 de la Ley 24.240 y la Disposición 954/2025, el pedido será cancelado sin cargo y el stock reintegrado.`
    );
    if (!confirmacion) return;

    setRevocandoId(pedidoId);
    setErrorRevocacion(null);
    setCodigoRevocacion(null);

    try {
      const res = await revocarPedido(pedidoId);
      // Mostrar código de solicitud en pantalla con role="status"
      setCodigoRevocacion({
        pedidoId,
        codigo: res.codigo,
      });
      // Refrescar historial
      await cargarHistorial();
    } catch (err) {
      console.error("Error al revocar pedido:", err);
      setErrorRevocacion(err.message || "Error al procesar la revocación.");
    } finally {
      setRevocandoId(null);
    }
  };

  // ESTADO 1: Cargando
  if (cargando && pedidos.length === 0) {
    return (
      <div className="pedidos-container" id="estado-cargando" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <div style={{ width: "40px", height: "40px", border: "4px solid var(--color-border)", borderTopColor: "var(--color-primary)", borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 1s infinite linear" }}></div>
        <p style={{ fontFamily: "var(--font-title)", fontStyle: "italic", color: "var(--color-text-light)" }}>
          Cargando tu historial de pedidos...
        </p>
      </div>
    );
  }

  // ESTADO 2: Error
  if (error) {
    return (
      <div className="pedidos-container" id="estado-error" style={{ maxWidth: "600px", margin: "3rem auto", padding: "2rem", textAlign: "center", background: "#fff", borderRadius: "12px", border: "1px solid var(--color-error)" }}>
        <h3 style={{ color: "var(--color-error)", marginBottom: "1rem" }}>Ocurrió un inconveniente</h3>
        <p style={{ color: "var(--color-text)", marginBottom: "1.5rem" }}>{error}</p>
        <button onClick={cargarHistorial} className="btn" style={{ width: "auto", padding: "0.6rem 2rem" }}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="pedidos-container" style={{ maxWidth: "900px", margin: "2rem auto", padding: "1.5rem" }}>
      <h2 className="section-title">Historial de Mis Pedidos</h2>

      {/* Cartel de Revocación Exitosa con role="status" OBLIGATORIO por Disposición 954/2025 */}
      {codigoRevocacion && (
        <div
          role="status"
          id="notificacion-revocacion-exitosa"
          style={{
            background: "#e6f4ea",
            border: "2px solid #34a853",
            borderRadius: "10px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 12px rgba(52, 168, 83, 0.15)",
          }}
        >
          <h3 style={{ color: "#137333", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>✅</span> Solicitud de Arrepentimiento Registrada
          </h3>
          <p style={{ margin: "0.5rem 0" }}>
            Conforme a la <strong>Disposición 954/2025</strong> y la Ley N° 24.240, se ha revocado la compra del <strong>Pedido #{codigoRevocacion.pedidoId}</strong>.
          </p>
          <p style={{ fontSize: "1.1rem", margin: "1rem 0" }}>
            Tu código identificatorio de solicitud es:{" "}
            <strong
              id="codigo-identificatorio"
              style={{
                fontFamily: "monospace",
                fontSize: "1.3rem",
                backgroundColor: "#fff",
                padding: "0.3rem 0.8rem",
                borderRadius: "6px",
                border: "1px solid #137333",
                color: "#137333",
              }}
            >
              {codigoRevocacion.codigo}
            </strong>
          </p>
          <p style={{ fontSize: "0.85rem", color: "#5f6368", margin: 0 }}>
            Conservá este código como constancia legal de tu solicitud.
          </p>
        </div>
      )}

      {errorRevocacion && (
        <div
          role="alert"
          style={{
            background: "#fce8e6",
            border: "1px solid #d93025",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            color: "#c5221f",
          }}
        >
          ⚠️ {errorRevocacion}
        </div>
      )}

      {/* ESTADO 3: Lista Vacía */}
      {pedidos.length === 0 ? (
        <div
          id="estado-vacio"
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid var(--color-border)",
          }}
        >
          <p style={{ fontSize: "1.2rem", color: "var(--color-text-light)", marginBottom: "1.5rem" }}>
            Aún no has realizado ninguna compra en Dulce Vicio.
          </p>
          <Link to="/" className="btn" style={{ textDecoration: "none", display: "inline-block", width: "auto", padding: "0.75rem 2rem" }}>
            Ver Catálogo de Postres
          </Link>
        </div>
      ) : (
        /* Lista con pedidos */
        <div className="orders-list" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {pedidos.map((pedido) => {
            const fechaPedido = new Date(pedido.creado_en || pedido.fecha).toLocaleString("es-AR");
            const esRevocable = puedeRevocar(pedido);

            return (
              <div
                key={pedido.id}
                className="order-card"
                id={`pedido-${pedido.id}`}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px solid var(--color-border)",
                  padding: "1.5rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* Cabecera del pedido: Número, estado y fecha */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    borderBottom: "1px solid var(--color-border)",
                    paddingBottom: "1rem",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 0.25rem 0", fontFamily: "var(--font-title)" }}>
                      Pedido #{pedido.id}
                    </h3>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-light)" }}>
                      Fecha: {fechaPedido}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.3rem 0.8rem",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        backgroundColor:
                          pedido.estado === "cancelado"
                            ? "#fce8e6"
                            : pedido.estado === "pagado"
                            ? "#e6f4ea"
                            : "#fff8e1",
                        color:
                          pedido.estado === "cancelado"
                            ? "#c5221f"
                            : pedido.estado === "pagado"
                            ? "#137333"
                            : "#b06000",
                      }}
                      id={`estado-pedido-${pedido.id}`}
                    >
                      {pedido.estado}
                    </span>
                  </div>
                </div>

                {/* Lista de ítems: USAR producto_id como key obligatoriamente */}
                <div className="order-items-list" style={{ marginBottom: "1rem" }}>
                  <p style={{ fontWeight: "600", fontSize: "0.95rem", marginBottom: "0.5rem" }}>Ítems del Pedido:</p>
                  {pedido.items &&
                    pedido.items.map((item) => {
                      const itemKey = item.producto_id;
                      const nombreProd = item.producto?.nombre || `Producto #${item.producto_id}`;
                      const subtotal = Number(item.precio_unitario) * item.cantidad;

                      return (
                        <div
                          key={itemKey}
                          id={`item-pedido-${item.producto_id}`}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.9rem",
                            padding: "0.35rem 0",
                            borderBottom: "1px dashed var(--color-border)",
                          }}
                        >
                          <span>
                            {nombreProd} (x{item.cantidad})
                          </span>
                          <span style={{ fontWeight: "500" }}>{formatearMoneda(subtotal)}</span>
                        </div>
                      );
                    })}
                </div>

                {/* Total y Botón de Arrepentimiento */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                    paddingTop: "0.5rem",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700" }}>Total: </span>
                    <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-primary)" }}>
                      {formatearMoneda(pedido.total)}
                    </span>
                  </div>

                  <div>
                    {/* Botón «Arrepentirme de esta compra» visible solo si puedeRevocar() da true */}
                    {esRevocable && (
                      <button
                        onClick={() => handleRevocar(pedido.id)}
                        disabled={revocandoId === pedido.id}
                        className="btn btn-secondary"
                        style={{
                          width: "auto",
                          padding: "0.5rem 1.2rem",
                          color: "var(--color-error)",
                          borderColor: "var(--color-error)",
                          fontSize: "0.85rem",
                        }}
                        id={`btn-revocar-${pedido.id}`}
                      >
                        {revocandoId === pedido.id
                          ? "Cancelando…"
                          : "Arrepentirme de esta compra"}
                      </button>
                    )}
                    {pedido.estado === "cancelado" && (
                      <span style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic" }}>
                        Compra revocada sin costo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
