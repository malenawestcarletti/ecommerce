import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUsuario, registrarUsuario, getPerfilActual } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("access_token") || null);
  const [usuario, setUsuario] = useState(() => {
    try {
      const u = localStorage.getItem("usuario");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  });
  const [cargandoAuth, setCargandoAuth] = useState(true);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuario(null);
  };

  useEffect(() => {
    const verificarSesion = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        try {
          const profile = await getPerfilActual();
          setUsuario(profile);
          localStorage.setItem("usuario", JSON.stringify(profile));
        } catch (err) {
          console.warn("Sesión expirada o inválida:", err);
          logout();
        }
      }
      setCargandoAuth(false);
    };

    verificarSesion();
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUsuario(email, password);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setToken(data.access_token);
    setUsuario(data.usuario);
    return data;
  };

  const registro = async (datos) => {
    const data = await registrarUsuario(datos);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setToken(data.access_token);
    setUsuario(data.usuario);
    return data;
  };


  return (
    <AuthContext.Provider
      value={{
        token,
        usuario,
        estaAutenticado: !!token,
        cargandoAuth,
        login,
        registro,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
