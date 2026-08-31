import React, { useState, useEffect } from 'react';
import { getWelcomeInfo, getProductos, createProducto, crearPedido, cancelarPedido } from './services/api';
import Catalogo from './pages/Catalogo';

function App() {
  const [productos, setProductos] = useState([]);
  const [welcomeInfo, setWelcomeInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Paginación y Filtros
  const [skip, setSkip] = useState(0);
  const [limit] = useState(6); // 6 productos por página es excelente para el diseño
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroPrecioMax, setFiltroPrecioMax] = useState('');

  // Formulario de Producto (Modo Admin)
  const [nuevoProd, setNuevoProd] = useState({
    nombre: '',
    precio_final: '',
    cuotas_cantidad: 1,
    garantia_meses: 0,
    stock: ''
  });
  const [formExito, setFormExito] = useState(false);
  const [formError, setFormError] = useState(null);

  // Carrito de compras
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Datos de Checkout
  const [checkoutNombre, setCheckoutNombre] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState(null);

  // Pedido Exitoso
  const [pedidoExitoso, setPedidoExitoso] = useState(null);
  const [pedidoCancelado, setPedidoCancelado] = useState(false);

  // Vista 100% Comprador por defecto (Modo Admin oculto)
  const [modoAdmin, setModoAdmin] = useState(false);

  // Modal Arrepentimiento Legal (Botón general en Footer)
  const [modalAbierto, setModalAbierto] = useState(false);
  const [compraId, setCompraId] = useState('');
  const [arrepentimientoEnviado, setArrepentimientoEnviado] = useState(false);

  // Cargar datos al montar y cuando cambien filtros o paginación
  const cargarDatos = async () => {
    try {
      const [info, listaProds] = await Promise.all([
        getWelcomeInfo(),
        getProductos(skip, limit, filtroNombre, filtroPrecioMax)
      ]);
      setWelcomeInfo(info);
      setProductos(listaProds);
    } catch (err) {
      console.error(err);
      setError("No se pudo establecer conexión con el backend de FastAPI. Asegurate de que esté corriendo en el puerto 8000.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [skip, filtroNombre, filtroPrecioMax]);

  // Manejar agregar al carrito
  const handleAddToCart = (producto) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.producto.id === producto.id);
      if (existing) {
        if (existing.cantidad >= producto.stock) {
          alert(`Disculpas, solo quedan ${producto.stock} unidades en stock.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prevCart, { producto, cantidad: 1 }];
    });
    setCartOpen(true); // Abrir el carrito para dar feedback inmediato al usuario
  };

  // Manejar cambiar cantidad en el carrito
  const handleUpdateQty = (productoId, nuevaCantidad, stockMax) => {
    if (nuevaCantidad < 1) return;
    if (nuevaCantidad > stockMax) {
      alert(`Disculpas, solo quedan ${stockMax} unidades en stock.`);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.producto.id === productoId ? { ...item, cantidad: nuevaCantidad } : item
      )
    );
  };

  // Manejar quitar del carrito
  const handleRemoveFromCart = (productoId) => {
    setCart((prevCart) => prevCart.filter((item) => item.producto.id !== productoId));
  };

  // Calcular total
  const cartTotal = cart.reduce((sum, item) => sum + item.producto.precio_final * item.cantidad, 0);

  // Manejar el checkout (crear pedido en DB)
  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError(null);

    if (!checkoutNombre.trim() || !checkoutEmail.trim()) {
      setCheckoutError("Por favor, completá tu nombre y correo electrónico.");
      return;
    }

    const pedidoData = {
      nombre_cliente: checkoutNombre,
      email_cliente: checkoutEmail,
      items: cart.map((item) => ({
        producto_id: item.producto.id,
        cantidad: item.cantidad
      }))
    };

    try {
      const dbPedido = await crearPedido(pedidoData);
      setPedidoExitoso(dbPedido);
      setPedidoCancelado(false);
      setCart([]); // Vaciar carrito
      setCartOpen(false); // Cerrar panel lateral
      setCheckoutNombre('');
      setCheckoutEmail('');
      cargarDatos(); // Recargar productos para actualizar stocks
    } catch (err) {
      setCheckoutError(err.message || "Error al registrar la compra.");
    }
  };

  // Cancelación directa del pedido recién realizado
  const handleCancelarPedidoReciente = async (pedidoId) => {
    try {
      await cancelarPedido(pedidoId);
      setPedidoCancelado(true);
      cargarDatos(); // Recargar productos para restaurar stocks en el catálogo
    } catch (err) {
      alert(err.message || "No se pudo cancelar el pedido.");
    }
  };

  // Enviar formulario de arrepentimiento general (Footer)
  const handleEnviarArrepentimiento = (e) => {
    e.preventDefault();
    if (!compraId.trim()) return;
    setArrepentimientoEnviado(true);
  };

  // Cerrar y resetear modal de arrepentimiento
  const cerrarModal = () => {
    setModalAbierto(false);
    setCompraId('');
    setArrepentimientoEnviado(false);
  };

  // Formatear moneda argentina
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);
  };

  // Registrar nuevo producto (Admin Panel)
  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormExito(false);

    if (!nuevoProd.nombre.trim() || !nuevoProd.precio_final || !nuevoProd.stock) {
      setFormError("Por favor, completá todos los campos requeridos.");
      return;
    }

    const precioNum = parseFloat(nuevoProd.precio_final);
    const stockNum = parseInt(nuevoProd.stock);
    const cuotasNum = parseInt(nuevoProd.cuotas_cantidad);
    const garantiaNum = parseInt(nuevoProd.garantia_meses);

    if (isNaN(precioNum) || precioNum <= 0) {
      setFormError("El precio debe ser un número mayor a 0.");
      return;
    }
    if (isNaN(stockNum) || stockNum < 0) {
      setFormError("El stock no puede ser negativo.");
      return;
    }

    const valorCuota = parseFloat((precioNum / cuotasNum).toFixed(2));

    const nuevoProductoData = {
      nombre: nuevoProd.nombre,
      precio_final: precioNum,
      cuotas_cantidad: cuotasNum,
      cuotas_valor: valorCuota,
      garantia_meses: garantiaNum,
      stock: stockNum
    };

    try {
      await createProducto(nuevoProductoData);
      setFormExito(true);
      setNuevoProd({
        nombre: '',
        precio_final: '',
        cuotas_cantidad: 1,
        garantia_meses: 0,
        stock: ''
      });
      cargarDatos();
    } catch (err) {
      setFormError(err.message || "Error al crear el producto.");
    }
  };

  if (cargando && productos.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'fadeIn 1s infinite linear' }} className="spinner"></div>
        <p style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: 'var(--color-text-light)' }}>Cargando pastelería artesanal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'white' }}>
          <h2 style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>Error de Conexión</h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn">Reintentar Conexión</button>
        </div>
      </div>
    );
  }

  const itemsEnCarrito = cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <h1 id="brand-title">Dulce <span>Vicio</span></h1>
          </div>
          <ul className="nav-links">
            <li><a href="#catalogo" id="nav-catalogo">Catálogo</a></li>
            {modoAdmin && <li><a href="#agregar" id="nav-agregar">Nuevo Producto (Admin)</a></li>}
            <li><a href="#contacto" id="nav-contacto">Contacto</a></li>
          </ul>
          
          {/* Botón Carrito */}
          <button 
            className="cart-toggle-btn" 
            onClick={() => setCartOpen(true)}
            id="btn-cart-toggle"
          >
            🛒 Ver Carrito {itemsEnCarrito > 0 && <span className="cart-count">{itemsEnCarrito}</span>}
          </button>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="hero">
        <img 
          src="/hero_pastry.jpg" 
          alt="Artisanal pastry table banner" 
          className="hero-image-bg"
        />
        <div className="hero-content">
          <h2>La Dulzura de la Tradición</h2>
          <p>Deliciosos postres elaborados artesanalmente con ingredientes seleccionados y el amor de siempre.</p>
          <a href="#catalogo" className="btn" style={{ display: 'inline-block', width: 'auto', padding: '0.8rem 2.5rem' }} id="hero-cta">Ver Delicias</a>
        </div>
      </section>

      {/* Main Grid */}
      <main className="main-content" style={{ gridTemplateColumns: modoAdmin ? '2fr 1fr' : '1fr' }}>
        
        {/* Productos, Buscadores y Paginación */}
        <div className="catalog-container">
          
          {/* Barra de Filtros en Tiempo Real */}
          <div className="filters-bar">
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-nombre">🔍 Buscar postre:</label>
              <input
                id="filter-nombre"
                type="text"
                className="filter-input"
                placeholder="Ej. Chocotorta..."
                value={filtroNombre}
                onChange={(e) => {
                  setFiltroNombre(e.target.value);
                  setSkip(0); // Volver a la primera página al filtrar
                }}
              />
            </div>
            
            <div className="filter-group">
              <label className="filter-label" htmlFor="filter-precio">💰 Precio máximo ($):</label>
              <input
                id="filter-precio"
                type="number"
                className="filter-input"
                placeholder="Ej. 10000"
                value={filtroPrecioMax}
                onChange={(e) => {
                  setFiltroPrecioMax(e.target.value);
                  setSkip(0); // Volver a la primera página al filtrar
                }}
              />
            </div>
          </div>

          <Catalogo productos={productos} setProductos={setProductos} onAddToCart={handleAddToCart} />
          
          {/* Controles de Paginación */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
              disabled={skip === 0} 
              onClick={() => setSkip((prev) => Math.max(0, prev - limit))}
              id="btn-page-prev"
            >
              Anterior
            </button>
            <span style={{ fontWeight: '600', color: 'var(--color-text)' }} id="page-indicator">
              Página {Math.floor(skip / limit) + 1}
            </span>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.5rem 1.5rem' }}
              disabled={productos.length < limit} 
              onClick={() => setSkip((prev) => prev + limit)}
              id="btn-page-next"
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* Formulario Agregar (Visible solo en Modo Admin) */}
        {modoAdmin && (
          <section id="agregar" className="form-panel">
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
                  onChange={(e) => setNuevoProd({ ...nuevoProd, cuotas_cantidad: parseInt(e.target.value) })}
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
                  placeholder="0 si es para consumo inmediato"
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
                <p style={{ color: 'var(--color-error)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }} id="form-error-msg">
                  ⚠️ {formError}
                </p>
              )}

              {formExito && (
                <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 500 }} id="form-success-msg">
                  ✨ ¡Producto registrado exitosamente!
                </p>
              )}

              <button type="submit" className="btn" id="btn-submit-producto">Registrar Postre</button>
            </form>
          </section>
        )}
      </main>

      {/* Banner Legal 24.240 */}
      {welcomeInfo && (
        <section className="compliance-banner" id="compliance-info">
          <div className="compliance-content">
            <p className="compliance-title">📄 Información de Cumplimiento Legal - República Argentina</p>
            <p>
              Operamos bajo las normativas vigentes y garantizamos el pleno cumplimiento de la <strong>{welcomeInfo.marco_legal.regulacion_principal}</strong>. 
              {welcomeInfo.marco_legal.detalles}
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <a href={welcomeInfo.marco_legal.enlace_util} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline', fontWeight: 500 }} id="link-legal">
                Ver texto de la Ley 24.240
              </a>
            </p>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer" id="contacto">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Pastelería Dulce Vicio</h3>
            <p>Elaboración artesanal de tortas y postres finos. Calidad y frescura garantizada.</p>
          </div>
          <div className="footer-section">
            <h3>Contacto</h3>
            <p>📍 Av. de Mayo 800, CABA, Argentina</p>
            <p>📞 +54 11 5555-4321</p>
            <p>✉️ hola@dulcevicio.com.ar</p>
          </div>
          <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
            <h3>Botonera Legal & Roles</h3>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.6rem 1.2rem', borderColor: '#ebd5db', color: '#ebd5db' }}
              onClick={() => setModalAbierto(true)}
              id="btn-arrepentimiento"
            >
              Botón de Arrepentimiento
            </button>
            
            {/* Toggle de Modo Admin / Comprador */}
            <button 
              className="admin-toggle-link"
              onClick={() => setModoAdmin(!modoAdmin)}
              style={{ marginTop: '0.5rem' }}
              id="btn-toggle-admin-mode"
            >
              {modoAdmin ? "🔒 Cambiar a vista de Comprador" : "🛠️ Cambiar a Panel de Carga (Admin)"}
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dulce Vicio. Todos los derechos reservados.</p>
          <p>Defensa de las y los Consumidores. Para reclamos ingresá acá.</p>
        </div>
      </footer>

      {/* --- CÓDIGO NUEVO: LATERAL DEL CARRITO --- */}
      {cartOpen && (
        <>
          <div className="cart-drawer-overlay" onClick={() => setCartOpen(false)}></div>
          <div className="cart-drawer open" id="cart-drawer-container">
            <div className="cart-drawer-header">
              <h3>Tu Carrito</h3>
              <button className="cart-drawer-close" onClick={() => setCartOpen(false)}>&times;</button>
            </div>
            
            <div className="cart-drawer-body">
              {cart.length === 0 ? (
                <p className="cart-empty-msg">Tu carrito está vacío.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.producto.id} className="cart-item" id={`cart-item-${item.producto.id}`}>
                    <div className="cart-item-details">
                      <p className="cart-item-name">{item.producto.nombre}</p>
                      <p className="cart-item-price">{formatearMoneda(item.producto.precio_final)} c/u</p>
                    </div>
                    
                    <div className="cart-item-actions">
                      <button 
                        className="qty-btn"
                        onClick={() => handleUpdateQty(item.producto.id, item.cantidad - 1, item.producto.stock)}
                      >-</button>
                      <span className="cart-item-qty">{item.cantidad}</span>
                      <button 
                        className="qty-btn"
                        onClick={() => handleUpdateQty(item.producto.id, item.cantidad + 1, item.producto.stock)}
                      >+</button>
                      
                      <button 
                        className="cart-item-remove-btn"
                        onClick={() => handleRemoveFromCart(item.producto.id)}
                        title="Eliminar producto"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="cart-total-row">
                  <span>Total:</span>
                  <span id="cart-total-value">{formatearMoneda(cartTotal)}</span>
                </div>
                
                {/* Formulario de Checkout */}
                <form onSubmit={handleCheckout} className="checkout-section" id="form-checkout">
                  <p className="checkout-title">Datos del Comprador</p>
                  
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }} htmlFor="checkout-nombre">Nombre Completo *</label>
                    <input 
                      id="checkout-nombre"
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. María Pérez" 
                      value={checkoutNombre}
                      onChange={(e) => setCheckoutNombre(e.target.value)}
                      required 
                      style={{ padding: '0.6rem 0.8rem' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.2rem' }} htmlFor="checkout-email">Correo Electrónico *</label>
                    <input 
                      id="checkout-email"
                      type="email" 
                      className="form-input" 
                      placeholder="Ej. maria@ejemplo.com" 
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      required
                      style={{ padding: '0.6rem 0.8rem' }}
                    />
                  </div>

                  {checkoutError && (
                    <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', margin: '0.25rem 0' }}>
                      ⚠️ {checkoutError}
                    </p>
                  )}

                  <button type="submit" className="btn" style={{ marginTop: '0.5rem' }} id="btn-submit-checkout">
                    Confirmar Compra ($)
                  </button>
                </form>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- CÓDIGO NUEVO: PANTALLA DE COMPRA EXITOSA Y CANCELACIÓN --- */}
      {pedidoExitoso && (
        <div className="success-overlay" id="checkout-success-overlay">
          <div className="success-card" id="checkout-success-card">
            
            {!pedidoCancelado ? (
              <>
                <span className="success-icon">🎉</span>
                <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-text)', marginBottom: '0.5rem' }}>
                  ¡Compra Exitosa!
                </h2>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>
                  Gracias por tu confianza. Tu pedido ha sido registrado en nuestro sistema.
                </p>

                <div className="order-summary-box">
                  <p className="order-summary-title">Resumen de Pedido # {pedidoExitoso.id}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginBottom: '0.5rem' }}>
                    Fecha: {new Date(pedidoExitoso.fecha).toLocaleString('es-AR')}
                  </p>
                  
                  {pedidoExitoso.items && pedidoExitoso.items.map((item) => (
                    <div key={item.id} className="order-summary-item">
                      <span>{item.producto.nombre} (x{item.cantidad})</span>
                      <span>{formatearMoneda(item.precio_unitario * item.cantidad)}</span>
                    </div>
                  ))}
                  
                  <div className="order-summary-total">
                    <span>Total Abonado:</span>
                    <span>{formatearMoneda(pedidoExitoso.total)}</span>
                  </div>
                </div>

                <div className="cancel-order-section">
                  <p className="cancel-order-desc">
                    <strong>¿Tuviste algún error?</strong> De acuerdo con la Ley N° 24.240 de Defensa del Consumidor, tenés derecho a revocar la compra o arrepentirte inmediatamente sin cargo.
                  </p>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleCancelarPedidoReciente(pedidoExitoso.id)}
                    id="btn-cancel-order-recent"
                  >
                    🚫 Cancelar Pedido (Botón de Arrepentimiento)
                  </button>
                </div>

                <button 
                  className="btn" 
                  style={{ marginTop: '1.5rem', background: '#ccc', color: '#333' }} 
                  onClick={() => setPedidoExitoso(null)}
                  id="btn-success-close"
                >
                  Entendido / Volver
                </button>
              </>
            ) : (
              <>
                <span className="success-icon" style={{ color: 'var(--color-error)' }}>🛑</span>
                <h2 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-error)', marginBottom: '0.5rem' }}>
                  Pedido Cancelado
                </h2>
                <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                  El pedido <strong># {pedidoExitoso.id}</strong> ha sido cancelado con éxito conforme a tu derecho de arrepentimiento.
                </p>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem', color: 'var(--color-text)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  El pago no será procesado y el stock de los productos ha sido reintegrado inmediatamente al catálogo.
                </div>
                <button 
                  className="btn" 
                  onClick={() => setPedidoExitoso(null)}
                  id="btn-cancel-acknowledged"
                >
                  Entendido
                </button>
              </>
            )}

          </div>
        </div>
      )}

      {/* Modal del Botón de Arrepentimiento General (Footer) */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal} id="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()} id="modal-container">
            <button className="modal-close" onClick={cerrarModal} id="btn-close-modal">&times;</button>
            <h2 className="modal-title">Botón de Arrepentimiento</h2>
            
            {!arrepentimientoEnviado ? (
              <div className="modal-body">
                <p>
                  De acuerdo con el Art. 34 de la Ley N° 24.240, tenés derecho a revocar tu compra dentro de los 
                  <strong> 10 días corridos</strong> desde la entrega del producto o la firma del contrato.
                </p>
                <p>Ingresá los datos de tu pedido para iniciar el trámite de cancelación sin costo alguno:</p>
                
                <form onSubmit={handleEnviarArrepentimiento} style={{ marginTop: '1.5rem' }} id="form-arrepentimiento">
                  <div className="form-group">
                    <label className="form-label" htmlFor="input-compra-id">Código de Compra / N° Pedido *</label>
                    <input 
                      id="input-compra-id"
                      type="text" 
                      className="form-input" 
                      placeholder="Ej. 12"
                      value={compraId}
                      onChange={(e) => setCompraId(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn" style={{ marginTop: '1rem' }} id="btn-confirmar-arrepentimiento">
                    Solicitar Cancelación
                  </button>
                </form>
              </div>
            ) : (
              <div className="modal-body" style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ fontSize: '3rem', margin: 0 }}>✉️</p>
                <h3 style={{ margin: '1rem 0', fontFamily: 'var(--font-title)' }}>Solicitud Recibida</h3>
                <p>
                  Hemos recibido tu solicitud de cancelación para el pedido <strong>{compraId}</strong>.
                </p>
                <p>
                  El stock ya ha sido reintegrado y nos contactaremos a la brevedad por mail para confirmar los detalles de la anulación del cobro.
                </p>
                <button className="btn" style={{ marginTop: '1.5rem' }} onClick={cerrarModal} id="btn-arrepentimiento-ok">
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
