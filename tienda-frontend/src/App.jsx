import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CarritoProvider } from "./context/CarritoContext";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import RutaProtegida from "./components/RutaProtegida";

import Catalogo from "./pages/Catalogo";
import Carrito from "./pages/Carrito";
import MisPedidos from "./pages/MisPedidos";
import Arrepentimiento from "./pages/Arrepentimiento";
import MisDatos from "./pages/MisDatos";
import Login from "./pages/Login";

import { getWelcomeInfo, createProducto } from "./services/api";

function Inicio() {
  const [welcomeInfo, setWelcomeInfo] = useState(null);
  const [catalogoKey, setCatalogoKey] = useState(0);
  const [modoAdmin, setModoAdmin] = useState(false);
  const location = useLocation();

  // Formulario nuevo producto (Modo Admin)
  const [nuevoProd, setNuevoProd] = useState({
    nombre: "",
    precio_final: "",
    cuotas_cantidad: 1,
    garantia_meses: 0,
    stock: "",
  });
  const [formExito, setFormExito] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    getWelcomeInfo()
      .then((data) => setWelcomeInfo(data))
      .catch((err) => console.warn("No se pudo cargar welcome info:", err));
  }, []);

  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormExito(false);

    if (!nuevoProd.nombre.trim() || !nuevoProd.precio_final || !nuevoProd.stock) {
      setFormError("Por favor, completá todos los campos requeridos.");
      return;
    }

    const precioNum = parseFloat(nuevoProd.precio_final);
    const stockNum = parseInt(nuevoProd.stock, 10);
    const cuotasNum = parseInt(nuevoProd.cuotas_cantidad, 10);
    const garantiaNum = parseInt(nuevoProd.garantia_meses, 10) || 0;

    if (isNaN(precioNum) || precioNum <= 0) {
      setFormError("El precio debe ser mayor a 0.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("El stock no puede ser negativo.");
      return;
    }

    const valorCuota = parseFloat((precioNum / cuotasNum).toFixed(2));

    try {
      await createProducto({
        nombre: nuevoProd.nombre.trim(),
        precio_final: precioNum,
        cuotas_cantidad: cuotasNum,
        cuotas_valor: valorCuota,
        garantia_meses: garantiaNum,
        stock: stockNum,
      });
      setFormExito(true);
      setNuevoProd({
        nombre: "",
        precio_final: "",
        cuotas_cantidad: 1,
        garantia_meses: 0,
        stock: "",
      });
      setCatalogoKey((k) => k + 1);
    } catch (err) {
      setFormError(err.message || "Error al registrar el producto.");
    }
  };

  return (
    <>
      {/* Mensaje Flash Informativo (e.g. tras baja de cuenta) */}
      {location.state?.mensajeExito && (
        <div
          role="status"
          style={{
            maxWidth: "1000px",
            margin: "1rem auto",
            padding: "1rem 1.5rem",
            background: "#e6f4ea",
            border: "1px solid #34a853",
            borderRadius: "8px",
            color: "#137333",
            textAlign: "center",
            fontWeight: "500",
          }}
        >
          ✅ {location.state.mensajeExito}
        </div>
      )}

      {/* Hero Banner */}
      <section className="hero">
        <img
          src="/hero_pastry.jpg"
          alt="Banner Pastelería Dulce Vicio"
          className="hero-image-bg"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
        <div className="hero-content">
          <h2>La Dulzura de la Tradición</h2>
          <p>
            Deliciosos postres elaborados artesanalmente con ingredientes seleccionados y el amor de siempre.
          </p>
          <a href="#catalogo" className="btn" style={{ display: "inline-block", width: "auto", padding: "0.8rem 2.5rem" }}>
            Ver Delicias
          </a>
        </div>
      </section>

      {/* Contenido Principal */}
      <main className="main-content" style={{ gridTemplateColumns: modoAdmin ? "2fr 1fr" : "1fr", maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
        <div className="catalog-container">
          <Catalogo key={catalogoKey} />
        </div>

        {/* Panel Carga Producto (Admin) */}
        {modoAdmin && (
          <section id="agregar" className="form-panel" style={{ background: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
            <h2 className="form-title">Agregar Producto</h2>
            <form onSubmit={handleCrearProducto} id="form-nuevo-producto">
              <div className="form-group">
                <label className="form-label" htmlFor="input-nombre">Nombre del Postre *</label>
                <input
                  id="input-nombre"
                  type="text"
                  className="form-input"
                  placeholder="Ej. Tarta de Frutillas"
                  value={nuevoProd.nombre}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-precio">Precio Final ($ ARS) *</label>
                <input
                  id="input-precio"
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="Ej. 9500"
                  value={nuevoProd.precio_final}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, precio_final: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="select-cuotas">Cuotas de Financiación</label>
                <select
                  id="select-cuotas"
                  className="form-input"
                  value={nuevoProd.cuotas_cantidad}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, cuotas_cantidad: parseInt(e.target.value, 10) })}
                >
                  <option value="1">1 cuota (Pago único)</option>
                  <option value="3">3 cuotas sin interés</option>
                  <option value="6">6 cuotas sin interés</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-garantia">Garantía / Conservación (Meses)</label>
                <input
                  id="input-garantia"
                  type="number"
                  className="form-input"
                  placeholder="0 si es consumo inmediato"
                  value={nuevoProd.garantia_meses}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, garantia_meses: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-stock">Unidades Disponibles (Stock) *</label>
                <input
                  id="input-stock"
                  type="number"
                  className="form-input"
                  placeholder="Ej. 10"
                  value={nuevoProd.stock}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, stock: e.target.value })}
                  required
                />
              </div>

              {formError && (
                <p style={{ color: "var(--color-error)", fontSize: "0.9rem", margin: "0.5rem 0" }}>
                  ⚠️ {formError}
                </p>
              )}
              {formExito && (
                <p style={{ color: "var(--color-success)", fontSize: "0.9rem", margin: "0.5rem 0" }}>
                  ✨ ¡Producto registrado exitosamente!
                </p>
              )}

              <button type="submit" className="btn" style={{ marginTop: "1rem" }}>
                Registrar Postre
              </button>
            </form>
          </section>
        )}
      </main>

      {/* Botón para alternar modo admin */}
      <div style={{ textAlign: "center", margin: "1rem 0" }}>
        <button
          onClick={() => setModoAdmin(!modoAdmin)}
          className="admin-toggle-link"
          style={{ background: "none", border: "none", color: "var(--color-text-light)", textDecoration: "underline", cursor: "pointer", fontSize: "0.85rem" }}
          id="btn-toggle-admin-mode"
        >
          {modoAdmin ? "🔒 Vista Comprador" : "🛠️ Panel de Carga de Productos"}
        </button>
      </div>

      {/* Banner Legal 24.240 y Disposición 954/2025 */}
      {welcomeInfo && (
        <section className="compliance-banner" id="compliance-info" style={{ maxWidth: "1200px", margin: "2rem auto" }}>
          <div className="compliance-content">
            <p className="compliance-title">📄 Información de Cumplimiento Legal - República Argentina</p>
            <p>
              Operamos bajo las normativas vigentes y garantizamos el pleno cumplimiento de la{" "}
              <strong>{welcomeInfo.marco_legal.regulacion_principal}</strong>. {welcomeInfo.marco_legal.detalles}
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              <a
                href={welcomeInfo.marco_legal.enlace_util}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "underline", fontWeight: 500 }}
                id="link-legal"
              >
                Ver texto de la Ley 24.240
              </a>
            </p>
          </div>
        </section>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <BrowserRouter>
          <div className="app-container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />

            <div style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/arrepentimiento" element={<Arrepentimiento />} />
                <Route path="/login" element={<Login />} />

                {/* Rutas Protegidas */}
                <Route
                  path="/mis-pedidos"
                  element={
                    <RutaProtegida>
                      <MisPedidos />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/mis-datos"
                  element={
                    <RutaProtegida>
                      <MisDatos />
                    </RutaProtegida>
                  }
                />
              </Routes>
            </div>

            <Footer />
          </div>
        </BrowserRouter>
      </CarritoProvider>
    </AuthProvider>
  );
}

export default App;
