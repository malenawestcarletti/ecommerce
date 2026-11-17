import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

export function ActualizacionDisponible() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="alert"
      className="banner-actualizacion"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: "#2c3e50",
        color: "#ffffff",
        padding: "1rem 1.5rem",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "1rem",
      }}
    >
      <span>Hay una versión nueva de la tienda</span>
      <button
        type="button"
        className="btn"
        onClick={() => updateServiceWorker(true)}
        style={{
          padding: "0.4rem 0.8rem",
          fontSize: "0.85rem",
          cursor: "pointer",
          backgroundColor: "#d97706",
          color: "#ffffff",
          border: "none",
          borderRadius: "4px",
        }}
      >
        Actualizar
      </button>
    </div>
  );
}

export default ActualizacionDisponible;
