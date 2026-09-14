import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RutaProtegida({ children }) {
  const { estaAutenticado, cargandoAuth } = useAuth();

  if (cargandoAuth) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
