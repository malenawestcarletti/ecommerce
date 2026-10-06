import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProductos,
  createProducto,
  subirImagen,
  eliminarProducto,
  getTodosLosPedidosAdmin,
} from "../services/api";
import { urlImagen } from "../utils/imagenes";
import "./AdminPanel.css";

const ADMIN_EMAIL_PERMITIDO = "dulcevicio@gmail.com";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export default function AdminPanel() {
  const { usuario, estaAutenticado, login, logout, cargandoAuth } = useAuth();
  const navigate = useNavigate();

  // Estados de navegación interna
  const [tabActiva, setTabActiva] = useState("productos"); // 'productos' | 'nuevo' | 'compras'

  // Estados de autenticación en pantalla de acceso admin
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL_PERMITIDO);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [iniciandoSesion, setIniciandoSesion] = useState(false);

  // Estados para Lista de Productos
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [busquedaProd, setBusquedaProd] = useState("");
  const [modalImagenProd, setModalImagenProd] = useState(null); // Producto seleccionado para cambio de imagen
  const [archivoNuevaFoto, setArchivoNuevaFoto] = useState(null);
  const [previewNuevaFoto, setPreviewNuevaFoto] = useState(null);
  const [subiendoNuevaFoto, setSubiendoNuevaFoto] = useState(false);
  const [errorModalFoto, setErrorModalFoto] = useState(null);
  const [mensajeExitoProd, setMensajeExitoProd] = useState(null);
  const modalFileInputRef = useRef(null);

  // Estados para Formulario Nuevo Producto
  const [nuevoProd, setNuevoProd] = useState({
    nombre: "",
    precio_final: "",
    cuotas_cantidad: 1,
    garantia_meses: 0,
    stock: "",
  });
  const [fotoNuevoProd, setFotoNuevoProd] = useState(null);
  const [previewFotoNuevo, setPreviewFotoNuevo] = useState(null);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [errorNuevoProd, setErrorNuevoProd] = useState(null);
  const [exitoNuevoProd, setExitoNuevoProd] = useState(null);
  const nuevoFileInputRef = useRef(null);

  // Estados para Historial de Compras (Admin)
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState(null);
  const [busquedaPedidos, setBusquedaPedidos] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  // Es el usuario el administrador autorizado dulcevicio@gmail.com?
  const esAdminValido =
    estaAutenticado &&
    usuario?.email?.toLowerCase() === ADMIN_EMAIL_PERMITIDO.toLowerCase() &&
    usuario?.rol === "admin";

  // Cargar productos
  const recargarProductos = async () => {
    setCargandoProductos(true);
    try {
      const data = await getProductos({ limit: 100 });
      setProductos(data || []);
    } catch (err) {
      console.error("Error al cargar productos:", err);
    } finally {
      setCargandoProductos(false);
    }
  };

  // Cargar todas las compras de todos los usuarios
  const recargarPedidos = async () => {
    setCargandoPedidos(true);
    setErrorPedidos(null);
    try {
      const data = await getTodosLosPedidosAdmin();
      setPedidos(data || []);
    } catch (err) {
      setErrorPedidos(err.message || "Error al cargar el historial de compras.");
    } finally {
      setCargandoPedidos(false);
    }
  };

  useEffect(() => {
    if (esAdminValido) {
      recargarProductos();
      recargarPedidos();
    }
  }, [esAdminValido]);

  // Limpieza de ObjectURLs
  useEffect(() => {
    return () => {
      if (previewNuevaFoto) URL.revokeObjectURL(previewNuevaFoto);
      if (previewFotoNuevo) URL.revokeObjectURL(previewFotoNuevo);
    };
  }, [previewNuevaFoto, previewFotoNuevo]);

  // Manejo de Login de Administrador
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);

    if (loginEmail.trim().toLowerCase() !== ADMIN_EMAIL_PERMITIDO.toLowerCase()) {
      setLoginError(
        `Acceso no autorizado: Solo la cuenta central '${ADMIN_EMAIL_PERMITIDO}' puede ingresar al panel de administración.`
      );
      return;
    }

    setIniciandoSesion(true);
    try {
      const resp = await login(loginEmail.trim().toLowerCase(), loginPassword);
      if (resp.usuario.rol !== "admin") {
        setLoginError("La cuenta no posee privilegios de administrador.");
      }
    } catch (err) {
      setLoginError(err.message || "Credenciales incorrectas. Verifique correo y contraseña.");
    } finally {
      setIniciandoSesion(false);
    }
  };

  // Manejo de Selección de Imagen en Modal de Cambio de Foto
  const handleSelectFotoModal = (e) => {
    setErrorModalFoto(null);
    const file = e.target.files?.[0];
    if (!file) {
      setArchivoNuevaFoto(null);
      setPreviewNuevaFoto(null);
      return;
    }

    if (!file.type || !file.type.startsWith("image/")) {
      setErrorModalFoto("El archivo debe ser una imagen válida (JPG, PNG o WebP).");
      if (modalFileInputRef.current) modalFileInputRef.current.value = "";
      return;
    }

    if (file.size >= MAX_BYTES) {
      setErrorModalFoto("La imagen no puede superar los 2 MB de peso.");
      if (modalFileInputRef.current) modalFileInputRef.current.value = "";
      return;
    }

    setArchivoNuevaFoto(file);
    setPreviewNuevaFoto(URL.createObjectURL(file));
  };

  // Guardar Cambio de Imagen
  const handleGuardarFotoModal = async (e) => {
    e.preventDefault();
    if (!modalImagenProd || !archivoNuevaFoto || subiendoNuevaFoto) return;

    setSubiendoNuevaFoto(true);
    setErrorModalFoto(null);

    try {
      const prodActualizado = await subirImagen(modalImagenProd.id, archivoNuevaFoto);
      setMensajeExitoProd(`¡Imagen de "${prodActualizado.nombre}" actualizada con éxito!`);
      // Actualizar en el estado de productos
      setProductos((prev) =>
        prev.map((p) => (p.id === prodActualizado.id ? prodActualizado : p))
      );
      // Cerrar modal
      cerrarModalFoto();
      setTimeout(() => setMensajeExitoProd(null), 4000);
    } catch (err) {
      setErrorModalFoto(err.message || "Error al subir la nueva imagen.");
    } finally {
      setSubiendoNuevaFoto(false);
    }
  };

  const cerrarModalFoto = () => {
    setModalImagenProd(null);
    setArchivoNuevaFoto(null);
    setPreviewNuevaFoto(null);
    setErrorModalFoto(null);
    if (modalFileInputRef.current) modalFileInputRef.current.value = "";
  };

  // Eliminar Producto
  const handleEliminarProducto = async (producto) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el producto "${producto.nombre}"?\nEsta acción no se puede deshacer y se retirará del catálogo de clientes.`
    );
    if (!confirmar) return;

    try {
      await eliminarProducto(producto.id);
      setProductos((prev) => prev.filter((p) => p.id !== producto.id));
      setMensajeExitoProd(`Producto "${producto.nombre}" eliminado exitosamente.`);
      setTimeout(() => setMensajeExitoProd(null), 4000);
    } catch (err) {
      alert(err.message || "Error al eliminar el producto.");
    }
  };

  // Selección de foto en Formulario de Nuevo Producto
  const handleSelectFotoNuevo = (e) => {
    setErrorNuevoProd(null);
    const file = e.target.files?.[0];
    if (!file) {
      setFotoNuevoProd(null);
      setPreviewFotoNuevo(null);
      return;
    }

    if (!file.type || !file.type.startsWith("image/")) {
      setErrorNuevoProd("El archivo debe ser una imagen válida (JPG, PNG o WebP).");
      if (nuevoFileInputRef.current) nuevoFileInputRef.current.value = "";
      return;
    }

    if (file.size >= MAX_BYTES) {
      setErrorNuevoProd("El archivo excede el tamaño máximo permitido de 2 MB.");
      if (nuevoFileInputRef.current) nuevoFileInputRef.current.value = "";
      return;
    }

    setFotoNuevoProd(file);
    setPreviewFotoNuevo(URL.createObjectURL(file));
  };

  // Registrar Nuevo Producto
  const handleCrearNuevoProducto = async (e) => {
    e.preventDefault();
    setErrorNuevoProd(null);
    setExitoNuevoProd(null);

    if (!nuevoProd.nombre.trim() || !nuevoProd.precio_final || !nuevoProd.stock) {
      setErrorNuevoProd("Por favor, completá los campos obligatorios (*).");
      return;
    }

    const precioNum = parseFloat(nuevoProd.precio_final);
    const stockNum = parseInt(nuevoProd.stock, 10);
    const cuotasNum = parseInt(nuevoProd.cuotas_cantidad, 10);
    const garantiaNum = parseInt(nuevoProd.garantia_meses, 10) || 0;

    if (isNaN(precioNum) || precioNum <= 0) {
      setErrorNuevoProd("El precio debe ser un número mayor a 0.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setErrorNuevoProd("El stock no puede ser negativo.");
      return;
    }

    const valorCuota = parseFloat((precioNum / cuotasNum).toFixed(2));
    setGuardandoNuevo(true);

    try {
      const creado = await createProducto({
        nombre: nuevoProd.nombre.trim(),
        precio_final: precioNum,
        cuotas_cantidad: cuotasNum,
        cuotas_valor: valorCuota,
        garantia_meses: garantiaNum,
        stock: stockNum,
      });

      // Si subió una foto, enviarla de inmediato
      let prodFinal = creado;
      if (fotoNuevoProd && creado?.id) {
        prodFinal = await subirImagen(creado.id, fotoNuevoProd);
      }

      setProductos((prev) => [prodFinal, ...prev]);
      setExitoNuevoProd(`¡Producto "${prodFinal.nombre}" creado y publicado exitosamente en el catálogo!`);

      // Limpiar formulario
      setNuevoProd({
        nombre: "",
        precio_final: "",
        cuotas_cantidad: 1,
        garantia_meses: 0,
        stock: "",
      });
      setFotoNuevoProd(null);
      setPreviewFotoNuevo(null);
      if (nuevoFileInputRef.current) nuevoFileInputRef.current.value = "";
    } catch (err) {
      setErrorNuevoProd(err.message || "Error al registrar el producto.");
    } finally {
      setGuardandoNuevo(false);
    }
  };

  // Formateadores
  const formatearARS = (val) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(val || 0);
  };

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "Fecha no disponible";
    const d = new Date(fechaStr);
    return isNaN(d.getTime())
      ? "Fecha no disponible"
      : d.toLocaleDateString("es-AR", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  // --- FILTROS DE PRODUCTOS ---
  const productosFiltrados = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(busquedaProd.toLowerCase().trim())
  );

  // --- FILTROS DE COMPRAS ---
  const pedidosFiltrados = pedidos.filter((ped) => {
    const coincideEstado =
      filtroEstado === "todos" || ped.estado?.toLowerCase() === filtroEstado.toLowerCase();

    const query = busquedaPedidos.toLowerCase().trim();
    if (!query) return coincideEstado;

    const coincideId = String(ped.id).includes(query);
    const coincideUsuarioNombre = ped.usuario?.nombre?.toLowerCase().includes(query);
    const coincideUsuarioEmail = ped.usuario?.email?.toLowerCase().includes(query);
    const coincideProducto = ped.items?.some((it) =>
      it.producto?.nombre?.toLowerCase().includes(query)
    );

    return coincideEstado && (coincideId || coincideUsuarioNombre || coincideUsuarioEmail || coincideProducto);
  });

  // Métricas de ventas
  const totalFacturado = pedidos
    .filter((p) => p.estado !== "cancelado")
    .reduce((acc, p) => acc + parseFloat(p.total || 0), 0);
  const totalRevocados = pedidos.filter((p) => p.estado === "cancelado").length;
  const clientesUnicos = new Set(pedidos.map((p) => p.usuario?.email).filter(Boolean)).size;

  // Si está cargando autenticación
  if (cargandoAuth) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 1rem" }}>
        <p style={{ fontSize: "1.2rem", color: "var(--color-text-light)" }}>
          Verificando credenciales de administrador...
        </p>
      </div>
    );
  }

  // PANTALLA DE ACCESO EXCLUSIVO ADMIN SI NO ESTÁ AUTENTICADO COMO dulcevicio@gmail.com
  if (!esAdminValido) {
    return (
      <div className="admin-login-wrapper" id="admin-login-screen">
        <span className="admin-login-icon">👑</span>
        <h2>Panel de Administrador</h2>
        <p>
          Acceso exclusivo para la cuenta central: <br />
          <strong style={{ color: "var(--color-primary)" }}>{ADMIN_EMAIL_PERMITIDO}</strong>
        </p>

        {estaAutenticado && usuario?.email?.toLowerCase() !== ADMIN_EMAIL_PERMITIDO.toLowerCase() && (
          <div
            style={{
              padding: "0.85rem 1rem",
              background: "#fff0f0",
              border: "1px solid #ffccd5",
              borderRadius: "8px",
              color: "var(--color-error)",
              fontSize: "0.88rem",
              marginBottom: "1.5rem",
              textAlign: "left",
            }}
          >
            ⚠️ Estás conectado con <strong>{usuario.email}</strong>. Esta cuenta no tiene permisos de administrador.
            <button
              onClick={() => logout()}
              className="btn btn-secondary"
              style={{ marginTop: "0.6rem", padding: "0.3rem 0.75rem", fontSize: "0.8rem", width: "100%" }}
            >
              Cerrar sesión para ingresar como Administrador
            </button>
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ textAlign: "left" }} id="form-login-admin">
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label" htmlFor="admin-email">
              Correo Electrónico Administrador:
            </label>
            <input
              id="admin-email"
              type="email"
              className="form-input"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="dulcevicio@gmail.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label className="form-label" htmlFor="admin-password">
              Contraseña de Acceso:
            </label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {loginError && (
            <p
              style={{
                color: "var(--color-error)",
                fontSize: "0.88rem",
                marginBottom: "1rem",
                fontWeight: "500",
              }}
              role="alert"
            >
              ⚠️ {loginError}
            </p>
          )}

          <button
            type="submit"
            className="btn"
            disabled={iniciandoSesion}
            style={{ width: "100%", padding: "0.8rem" }}
            id="btn-submit-admin-login"
          >
            {iniciandoSesion ? "Verificando..." : "Ingresar al Panel de Administrador"}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem" }}>
          <Link to="/" style={{ fontSize: "0.85rem", color: "var(--color-text-light)" }}>
            ← Volver a la Tienda de Clientes
          </Link>
        </div>
      </div>
    );
  }

  // PANTALLA PRINCIPAL DEL PANEL DE ADMINISTRADOR
  return (
    <div className="admin-container" id="admin-panel-dashboard">
      {/* Mensaje de Éxito Flotante */}
      {mensajeExitoProd && (
        <div
          role="status"
          style={{
            padding: "1rem 1.5rem",
            background: "#e6f4ea",
            border: "1px solid #34a853",
            borderRadius: "8px",
            color: "#137333",
            fontWeight: "600",
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>✨ {mensajeExitoProd}</span>
          <button
            onClick={() => setMensajeExitoProd(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#137333" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Encabezado del Panel */}
      <header className="admin-header">
        <div className="admin-title-group">
          <h1>Panel de Control de Administración</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.4rem" }}>
            <span className="admin-badge">👑 Administrador Central</span>
            <span style={{ fontSize: "0.9rem", color: "var(--color-text-light)" }}>
              {usuario.email}
            </span>
          </div>
        </div>

        <div className="admin-header-actions">
          <Link
            to="/"
            className="btn btn-secondary"
            style={{ padding: "0.55rem 1rem", fontSize: "0.9rem" }}
            title="Ir al Catálogo de Clientes"
          >
            👀 Ver Tienda
          </Link>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="btn"
            style={{ padding: "0.55rem 1rem", fontSize: "0.9rem", background: "#f1f3f5", color: "#495057", borderColor: "#ced4da" }}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Métricas Rápidas */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon">🎂</div>
          <div className="stat-info">
            <h3>{productos.length}</h3>
            <p>Postres en Catálogo</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">🛍️</div>
          <div className="stat-info">
            <h3>{pedidos.length}</h3>
            <p>Compras Totales</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <h3>{formatearARS(totalFacturado)}</h3>
            <p>Total Facturado</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{clientesUnicos}</h3>
            <p>Clientes Registrados</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon">↩️</div>
          <div className="stat-info">
            <h3>{totalRevocados}</h3>
            <p>Revocaciones / Bajas</p>
          </div>
        </div>
      </section>

      {/* Pestañas de Navegación del Panel */}
      <nav className="admin-tabs" aria-label="Secciones del Administrador">
        <button
          className={`admin-tab-btn ${tabActiva === "productos" ? "active" : ""}`}
          onClick={() => setTabActiva("productos")}
          id="tab-btn-productos"
        >
          📦 Gestión de Productos ({productos.length})
        </button>

        <button
          className={`admin-tab-btn ${tabActiva === "nuevo" ? "active" : ""}`}
          onClick={() => setTabActiva("nuevo")}
          id="tab-btn-nuevo"
        >
          ➕ Agregar Nuevo Producto
        </button>

        <button
          className={`admin-tab-btn ${tabActiva === "compras" ? "active" : ""}`}
          onClick={() => setTabActiva("compras")}
          id="tab-btn-compras"
        >
          🧾 Registro de Compras de Usuarios ({pedidos.length})
        </button>
      </nav>

      {/* ============================================================== */}
      {/* PESTAÑA 1: GESTIÓN DE PRODUCTOS (CAMBIAR IMAGEN / ELIMINAR)   */}
      {/* ============================================================== */}
      {tabActiva === "productos" && (
        <section id="admin-tab-content-productos">
          {/* Barra de Búsqueda y Herramientas */}
          <div className="admin-toolbar">
            <input
              type="text"
              className="admin-search-input"
              placeholder="🔍 Buscar producto por nombre..."
              value={busquedaProd}
              onChange={(e) => setBusquedaProd(e.target.value)}
              id="admin-search-prod-input"
            />
            <button
              onClick={() => setTabActiva("nuevo")}
              className="btn"
              style={{ width: "auto", padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
            >
              ➕ Cargar Producto
            </button>
          </div>

          {cargandoProductos && (
            <p style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-light)" }}>
              Cargando catálogo de productos...
            </p>
          )}

          {!cargandoProductos && productosFiltrados.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>
              <p style={{ fontSize: "1.1rem", color: "var(--color-text-light)", marginBottom: "1rem" }}>
                {busquedaProd ? `No se encontraron productos con el término "${busquedaProd}".` : "No hay productos registrados en el sistema."}
              </p>
              <button onClick={() => setTabActiva("nuevo")} className="btn" style={{ width: "auto" }}>
                Crear el primer producto
              </button>
            </div>
          )}

          {/* Grilla de Productos */}
          <div className="admin-products-grid">
            {productosFiltrados.map((prod) => {
              const imgSrc = urlImagen(prod);
              return (
                <article key={prod.id} className="admin-product-card" id={`admin-prod-card-${prod.id}`}>
                  <div className="admin-prod-thumb-container">
                    <span className="admin-prod-badge-id">ID: #{prod.id}</span>
                    {imgSrc ? (
                      <img src={imgSrc} alt={prod.nombre} className="admin-prod-thumb" loading="lazy" />
                    ) : (
                      <div className="admin-thumb-placeholder">
                        <span style={{ fontSize: "2rem" }}>📷</span>
                        <span style={{ fontSize: "0.8rem" }}>Sin foto</span>
                      </div>
                    )}
                  </div>

                  <div className="admin-prod-info">
                    <h3 className="admin-prod-title">{prod.nombre}</h3>
                    <p className="admin-prod-price">{formatearARS(prod.precio_final)}</p>

                    <div className="admin-prod-meta">
                      <span>
                        Stock:{" "}
                        <strong
                          style={{
                            color:
                              prod.stock > 10
                                ? "var(--color-success)"
                                : prod.stock > 0
                                ? "#e67e22"
                                : "var(--color-error)",
                          }}
                        >
                          {prod.stock} u.
                        </strong>
                      </span>
                      <span>
                        {prod.cuotas_cantidad > 1
                          ? `${prod.cuotas_cantidad} cuotas sin interés`
                          : "Pago único"}
                      </span>
                    </div>

                    <div className="admin-prod-actions">
                      <button
                        type="button"
                        className="btn-admin-action"
                        onClick={() => {
                          setModalImagenProd(prod);
                          setErrorModalFoto(null);
                        }}
                        id={`btn-cambiar-foto-${prod.id}`}
                        title="Cambiar la imagen de este producto"
                      >
                        📷 Cambiar Imagen
                      </button>

                      <button
                        type="button"
                        className="btn-admin-action btn-admin-delete"
                        onClick={() => handleEliminarProducto(prod)}
                        id={`btn-eliminar-prod-${prod.id}`}
                        title="Eliminar este producto permanentemente"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 2: AGREGAR NUEVO PRODUCTO                             */}
      {/* ============================================================== */}
      {tabActiva === "nuevo" && (
        <section id="admin-tab-content-nuevo" className="admin-form-container">
          <div style={{ marginBottom: "1.75rem", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.6rem", color: "var(--color-text)" }}>Nuevo Postre Artesanal</h2>
            <p style={{ color: "var(--color-text-light)", fontSize: "0.95rem" }}>
              Cargá los detalles y la imagen del nuevo postre. Una vez guardado, se mostrará inmediatamente en el catálogo que ven los clientes.
            </p>
          </div>

          {exitoNuevoProd && (
            <div
              style={{
                padding: "1rem 1.25rem",
                background: "#e6f4ea",
                border: "1px solid #34a853",
                borderRadius: "8px",
                color: "#137333",
                marginBottom: "1.5rem",
                fontWeight: "500",
              }}
            >
              🎉 {exitoNuevoProd}
              <div style={{ marginTop: "0.5rem" }}>
                <button
                  onClick={() => setTabActiva("productos")}
                  className="btn btn-secondary"
                  style={{ width: "auto", padding: "0.35rem 0.85rem", fontSize: "0.85rem", marginRight: "0.5rem" }}
                >
                  Ver en Lista de Productos
                </button>
                <Link
                  to="/"
                  className="btn"
                  style={{ width: "auto", padding: "0.35rem 0.85rem", fontSize: "0.85rem" }}
                >
                  Ver en la Tienda Pública
                </Link>
              </div>
            </div>
          )}

          {errorNuevoProd && (
            <div
              style={{
                padding: "1rem 1.25rem",
                background: "#fff0f0",
                border: "1px solid #ffccd5",
                borderRadius: "8px",
                color: "var(--color-error)",
                marginBottom: "1.5rem",
                fontWeight: "500",
              }}
            >
              ⚠️ {errorNuevoProd}
            </div>
          )}

          <form onSubmit={handleCrearNuevoProducto} id="form-admin-crear-producto">
            <div className="admin-form-grid">
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="nuevo-nombre">
                  Nombre del Postre *
                </label>
                <input
                  id="nuevo-nombre"
                  type="text"
                  className="form-input"
                  placeholder="Ej: Tarta Mousse de Chocolate Belga"
                  value={nuevoProd.nombre}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nuevo-precio">
                  Precio Final ($ ARS) *
                </label>
                <input
                  id="nuevo-precio"
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="Ej: 14500"
                  value={nuevoProd.precio_final}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, precio_final: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nuevo-stock">
                  Stock / Unidades Disponibles *
                </label>
                <input
                  id="nuevo-stock"
                  type="number"
                  className="form-input"
                  placeholder="Ej: 15"
                  value={nuevoProd.stock}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, stock: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nuevo-cuotas">
                  Planes de Financiación
                </label>
                <select
                  id="nuevo-cuotas"
                  className="form-input"
                  value={nuevoProd.cuotas_cantidad}
                  onChange={(e) =>
                    setNuevoProd({ ...nuevoProd, cuotas_cantidad: parseInt(e.target.value, 10) })
                  }
                >
                  <option value="1">1 cuota (Pago único sin recargo)</option>
                  <option value="3">3 cuotas sin interés</option>
                  <option value="6">6 cuotas sin interés</option>
                  <option value="12">12 cuotas fijas</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nuevo-garantia">
                  Conservación / Garantía (Meses)
                </label>
                <input
                  id="nuevo-garantia"
                  type="number"
                  className="form-input"
                  placeholder="0 si es consumo fresco e inmediato"
                  value={nuevoProd.garantia_meses}
                  onChange={(e) => setNuevoProd({ ...nuevoProd, garantia_meses: e.target.value })}
                />
              </div>

              {/* Selector de Foto para el Nuevo Producto */}
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="form-label" htmlFor="nuevo-foto">
                  Foto del Postre (JPG, PNG o WebP &lt; 2 MB)
                </label>
                <div className="admin-file-dropzone" onClick={() => nuevoFileInputRef.current?.click()}>
                  <input
                    id="nuevo-foto"
                    type="file"
                    accept="image/*"
                    ref={nuevoFileInputRef}
                    onChange={handleSelectFotoNuevo}
                    style={{ display: "none" }}
                  />
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.5rem" }}>📷</span>
                  <p style={{ fontWeight: "600", color: "var(--color-text)", margin: 0 }}>
                    Hacé clic acá para seleccionar la foto del postre
                  </p>
                  <span style={{ fontSize: "0.82rem", color: "var(--color-text-light)" }}>
                    Formatos admitidos: JPG, PNG, WebP (Máx. 2 MB)
                  </span>
                </div>

                {previewFotoNuevo && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      marginTop: "1rem",
                      padding: "0.75rem",
                      background: "var(--bg-secondary)",
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <img
                      src={previewFotoNuevo}
                      alt="Vista previa nuevo postre"
                      style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px" }}
                    />
                    <div style={{ flex: 1, fontSize: "0.85rem" }}>
                      <strong style={{ display: "block", color: "var(--color-text)" }}>
                        {fotoNuevoProd?.name}
                      </strong>
                      <span style={{ color: "var(--color-text-light)" }}>
                        {(fotoNuevoProd?.size ? fotoNuevoProd.size / 1024 : 0).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFotoNuevoProd(null);
                        setPreviewFotoNuevo(null);
                        if (nuevoFileInputRef.current) nuevoFileInputRef.current.value = "";
                      }}
                      className="btn btn-secondary"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", width: "auto" }}
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="submit"
                className="btn"
                disabled={guardandoNuevo}
                id="btn-guardar-nuevo-producto"
                style={{ width: "auto", padding: "0.75rem 2rem" }}
              >
                {guardandoNuevo ? "Guardando y Publicando..." : "Publicar Postre en Catálogo"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setTabActiva("productos")}
                style={{ width: "auto", padding: "0.75rem 1.5rem" }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ============================================================== */}
      {/* PESTAÑA 3: TODAS LAS COMPRAS DE TODOS LOS USUARIOS            */}
      {/* ============================================================== */}
      {tabActiva === "compras" && (
        <section id="admin-tab-content-compras">
          <div className="admin-toolbar">
            <input
              type="text"
              className="admin-search-input"
              placeholder="🔍 Buscar compra por ID, cliente, correo o postre..."
              value={busquedaPedidos}
              onChange={(e) => setBusquedaPedidos(e.target.value)}
              id="admin-search-pedidos-input"
            />

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <label htmlFor="filtro-estado-pedidos" style={{ fontSize: "0.85rem", fontWeight: "600" }}>
                Estado:
              </label>
              <select
                id="filtro-estado-pedidos"
                className="form-input"
                style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
              >
                <option value="todos">Todos los Estados</option>
                <option value="pendiente">Pendientes / Confirmados</option>
                <option value="cancelado">Revocados / Cancelados</option>
              </select>
            </div>

            <button
              onClick={recargarPedidos}
              className="btn btn-secondary"
              style={{ width: "auto", padding: "0.55rem 1rem", fontSize: "0.85rem" }}
              title="Refrescar lista de pedidos"
            >
              🔄 Actualizar
            </button>
          </div>

          {cargandoPedidos && (
            <p style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-light)" }}>
              Cargando historial de compras de todos los usuarios...
            </p>
          )}

          {errorPedidos && (
            <div
              style={{
                padding: "1rem",
                background: "#fff0f0",
                color: "var(--color-error)",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            >
              ⚠️ {errorPedidos}
            </div>
          )}

          {!cargandoPedidos && pedidosFiltrados.length === 0 && (
            <div style={{ textAlign: "center", padding: "3rem", background: "#fff", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>
              <p style={{ fontSize: "1.1rem", color: "var(--color-text-light)" }}>
                No se encontraron compras registradas con los filtros seleccionados.
              </p>
            </div>
          )}

          {/* Listado de Compras Unificadas */}
          <div className="admin-orders-list">
            {pedidosFiltrados.map((ped) => {
              const esCancelado = ped.estado?.toLowerCase() === "cancelado";
              const solicitud = ped.solicitudes?.[0];

              return (
                <article key={ped.id} className="admin-order-card" id={`admin-order-card-${ped.id}`}>
                  {/* Encabezado del Pedido con ID de compra, Usuario y Fecha todo junto */}
                  <div className="admin-order-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                      <span className="order-id-badge">ID de Compra: #{ped.id}</span>

                      {/* Datos del Usuario en Base de Datos */}
                      <span className="order-user-tag">
                        👤 {ped.usuario?.nombre || "Comprador Registrado"}{" "}
                        <span style={{ color: "var(--color-primary)", fontWeight: "400" }}>
                          ({ped.usuario?.email || "Sin email"})
                        </span>
                        {ped.usuario?.id && (
                          <span style={{ color: "var(--color-text-light)", fontSize: "0.75rem" }}>
                            [User ID: #{ped.usuario.id}]
                          </span>
                        )}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-light)" }}>
                        🕒 {formatearFecha(ped.creado_en || ped.fecha)}
                      </span>

                      <span
                        className="status-badge"
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "20px",
                          fontSize: "0.8rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          background: esCancelado ? "#ffebee" : "#e8f5e9",
                          color: esCancelado ? "#c62828" : "#2e7d32",
                          border: `1px solid ${esCancelado ? "#ef9a9a" : "#a5d6a7"}`,
                        }}
                      >
                        {esCancelado ? "Revocado / Cancelado" : "Confirmado / Pendiente"}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo del Pedido con Detalle de Productos Comprados */}
                  <div className="admin-order-body">
                    {/* Alerta de Revocación si fue cancelado */}
                    {esCancelado && (
                      <div
                        style={{
                          padding: "0.75rem 1rem",
                          background: "#fff3f4",
                          borderLeft: "4px solid var(--color-error)",
                          borderRadius: "4px",
                          marginBottom: "1rem",
                          fontSize: "0.88rem",
                          color: "var(--color-text)",
                        }}
                      >
                        <strong>⚠️ Revocación por Botón de Arrepentimiento:</strong>{" "}
                        {solicitud?.codigo ? (
                          <span>
                            Código de trámite: <code>{solicitud.codigo}</code>
                          </span>
                        ) : (
                          "El usuario ejerció su derecho de revocación dentro del plazo legal de 10 días."
                        )}
                        {solicitud?.creada_en && (
                          <span style={{ display: "block", color: "var(--color-text-light)", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                            Fecha de solicitud: {formatearFecha(solicitud.creada_en)}
                          </span>
                        )}
                      </div>
                    )}

                    <table className="admin-items-table">
                      <thead>
                        <tr>
                          <th>Postre / Producto</th>
                          <th style={{ width: "100px", textAlign: "center" }}>Cantidad</th>
                          <th style={{ width: "140px", textAlign: "right" }}>Precio Unitario</th>
                          <th style={{ width: "140px", textAlign: "right" }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ped.items?.map((it) => {
                          const unitario = parseFloat(it.precio_unitario || 0);
                          const subtotal = unitario * (it.cantidad || 1);
                          const prodNombre = it.producto?.nombre || `Producto (ID: #${it.producto_id || "?"})`;

                          return (
                            <tr key={it.id}>
                              <td>
                                <strong>{prodNombre}</strong>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <span style={{ background: "var(--bg-secondary)", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: "600" }}>
                                  {it.cantidad}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>{formatearARS(unitario)}</td>
                              <td style={{ textAlign: "right", fontWeight: "600" }}>{formatearARS(subtotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div className="order-total-row">
                      <span>Total de la Compra:</span>
                      <span style={{ color: "var(--color-primary)" }}>{formatearARS(ped.total)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* MODAL PARA CAMBIO DE IMAGEN DE CUALQUIER PRODUCTO             */}
      {/* ============================================================== */}
      {modalImagenProd && (
        <div className="admin-modal-overlay" onClick={cerrarModalFoto}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Cambiar Foto del Postre</h3>
              <button className="admin-modal-close" onClick={cerrarModalFoto}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.95rem", color: "var(--color-text)", marginBottom: "1rem" }}>
              Modificando imagen para: <strong>{modalImagenProd.nombre}</strong> (ID: #{modalImagenProd.id})
            </p>

            <form onSubmit={handleGuardarFotoModal}>
              {/* Imagen Actual vs Nueva */}
              <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1.5rem", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-light)", display: "block", marginBottom: "0.25rem" }}>
                    Foto Actual:
                  </span>
                  <div style={{ width: "90px", height: "90px", borderRadius: "8px", overflow: "hidden", background: "#f8f9fa", border: "1px solid var(--color-border)" }}>
                    {urlImagen(modalImagenProd) ? (
                      <img src={urlImagen(modalImagenProd)} alt="Actual" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#999", fontSize: "0.75rem" }}>
                        Sin foto
                      </div>
                    )}
                  </div>
                </div>

                <span style={{ fontSize: "1.5rem", color: "var(--color-text-light)" }}>➔</span>

                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-light)", display: "block", marginBottom: "0.25rem" }}>
                    Nueva Foto:
                  </span>
                  <div style={{ width: "90px", height: "90px", borderRadius: "8px", overflow: "hidden", background: "#f8f9fa", border: "2px dashed var(--color-primary)" }}>
                    {previewNuevaFoto ? (
                      <img src={previewNuevaFoto} alt="Nueva" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-primary)", fontSize: "0.75rem" }}>
                        Seleccionar
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Selector de Archivo */}
              <div className="admin-file-dropzone" onClick={() => modalFileInputRef.current?.click()} style={{ marginBottom: "1rem" }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={modalFileInputRef}
                  onChange={handleSelectFotoModal}
                  style={{ display: "none" }}
                  id="modal-file-input"
                />
                <span style={{ fontSize: "1.8rem", display: "block" }}>📂</span>
                <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--color-text)", margin: "0.3rem 0" }}>
                  Elegir nuevo archivo de imagen
                </p>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-light)" }}>
                  JPG, PNG o WebP (Máx. 2 MB)
                </span>
              </div>

              {archivoNuevaFoto && (
                <p style={{ fontSize: "0.85rem", color: "var(--color-text)", marginBottom: "1rem", textAlign: "center" }}>
                  Archivo seleccionado: <strong>{archivoNuevaFoto.name}</strong> ({(archivoNuevaFoto.size / 1024).toFixed(1)} KB)
                </p>
              )}

              {errorModalFoto && (
                <p style={{ color: "var(--color-error)", fontSize: "0.85rem", marginBottom: "1rem", fontWeight: "500", textAlign: "center" }} role="alert">
                  ⚠️ {errorModalFoto}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  className="btn"
                  disabled={!archivoNuevaFoto || subiendoNuevaFoto}
                  id="btn-confirmar-subir-foto"
                  style={{ flex: 1 }}
                >
                  {subiendoNuevaFoto ? "Subiendo..." : "Guardar Nueva Imagen"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cerrarModalFoto}
                  disabled={subiendoNuevaFoto}
                  style={{ width: "auto" }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
