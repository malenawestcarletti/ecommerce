import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCarrito } from "../context/CarritoContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { items } = useCarrito();
  const { usuario, estaAutenticado, logout } = useAuth();
  const navigate = useNavigate();

  const cantidadTotal = items.reduce((acc, it) => acc + it.cantidad, 0);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Link to="/" style={{ textDecoration: "none" }}>
            <h1 id="brand-title">
              Dulce <span>Vicio</span>
            </h1>
          </Link>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <Link to="/" id="nav-catalogo">
                Catálogo
              </Link>
            </li>

            {estaAutenticado ? (
              <>
                <li>
                  <Link to="/mis-pedidos" id="nav-mis-pedidos">
                    Mis Pedidos
                  </Link>
                </li>
                <li>
                  <Link to="/mis-datos" id="nav-mis-datos">
                    Mis Datos
                  </Link>
                </li>
                <li>
                  <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                    id="nav-logout"
                  >
                    Salir ({usuario?.nombre?.split(" ")[0] || "Usuario"})
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" id="nav-login" className="btn btn-secondary" style={{ padding: "0.4rem 0.9rem" }}>
                  Ingresar
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Botón Carrito */}
        <Link to="/carrito" className="cart-toggle-btn" id="btn-cart-toggle" style={{ textDecoration: "none" }}>
          🛒 Carrito {cantidadTotal > 0 && <span className="cart-count">{cantidadTotal}</span>}
        </Link>
      </div>
    </header>
  );
}
