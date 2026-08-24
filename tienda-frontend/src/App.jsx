import React, { useState, useEffect } from 'react';
import { getWelcomeInfo, getProductos, createProducto } from './services/api';
import Catalogo from './pages/Catalogo';

function App() {
  const [productos, setProductos] = useState([]);
  const [welcomeInfo, setWelcomeInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de Producto
  const [nuevoProd, setNuevoProd] = useState({
    nombre: '',
    precio_final: '',
    cuotas_cantidad: 1,
    garantia_meses: 0,
    stock: ''
  });
  const [formExito, setFormExito] = useState(false);
  const [formError, setFormError] = useState(null);

  // Modal Arrepentimiento
  const [modalAbierto, setModalAbierto] = useState(false);
  const [compraId, setCompraId] = useState('');
  const [arrepentimientoEnviado, setArrepentimientoEnviado] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    async function cargarDatos() {
      try {
        setCargando(true);
        const [info, listaProds] = await Promise.all([
          getWelcomeInfo(),
          getProductos()
        ]);
        setWelcomeInfo(info);
        setProductos(listaProds);
      } catch (err) {
        console.error(err);
        setError("No se pudo establecer conexión con el backend de FastAPI. Asegurate de que esté corriendo en el puerto 8000.");
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  // Manejar el envío de nuevo producto
  const handleCrearProducto = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormExito(false);

    // Validaciones básicas
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

    // Calcular id único en memoria
    const proximoId = productos.length > 0 ? Math.max(...productos.map(p => p.id)) + 1 : 1;
    // Calcular el valor de la cuota
    const valorCuota = parseFloat((precioNum / cuotasNum).toFixed(2));

    const nuevoProductoData = {
      id: proximoId,
      nombre: nuevoProd.nombre,
      precio_final: precioNum,
      cuotas_cantidad: cuotasNum,
      cuotas_valor: valorCuota,
      garantia_meses: garantiaNum,
      stock: stockNum
    };

    try {
      const creado = await createProducto(nuevoProductoData);
      setProductos([...productos, creado]);
      setFormExito(true);
      setNuevoProd({
        nombre: '',
        precio_final: '',
        cuotas_cantidad: 1,
        garantia_meses: 0,
        stock: ''
      });
    } catch (err) {
      setFormError(err.message || "Error al crear el producto.");
    }
  };

  // Manejar Botón de Arrepentimiento
  const handleEnviarArrepentimiento = (e) => {
    e.preventDefault();
    if (!compraId.trim()) return;
    setArrepentimientoEnviado(true);
  };

  // Cerrar y resetear modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setCompraId('');
    setArrepentimientoEnviado(false);
  };

  // Helper para dar formato de moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);
  };

  if (cargando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fdfbf7', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e3d2be', borderTopColor: '#c27a4d', borderRadius: '50%', animation: 'fadeIn 1s infinite linear' }} className="spinner"></div>
        <p style={{ fontFamily: 'Playfair Display', fontStyle: 'italic', color: '#5c3d2e' }}>Cargando pastelería artesanal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#fdfbf7', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '500px', padding: '2rem', border: '1px solid #e3d2be', borderRadius: '12px', background: 'white' }}>
          <h2 style={{ color: '#c62828', marginBottom: '1rem' }}>Error de Conexión</h2>
          <p style={{ color: '#6e584d', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn">Reintentar Conexión</button>
        </div>
      </div>
    );
  }

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
            <li><a href="#agregar" id="nav-agregar">Nuevo Producto</a></li>
            <li><a href="#contacto" id="nav-contacto">Contacto</a></li>
          </ul>
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
      <main className="main-content">
        {/* Productos */}
        <Catalogo productos={productos} setProductos={setProductos} />

        {/* Formulario Agregar */}
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
          <div className="footer-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <h3>Botonera Legal</h3>
            <button 
              className="btn btn-secondary" 
              style={{ width: 'auto', padding: '0.6rem 1.2rem', marginTop: '0.5rem', borderColor: '#f6eedf', color: '#f6eedf' }}
              onClick={() => setModalAbierto(true)}
              id="btn-arrepentimiento"
            >
              Botón de Arrepentimiento
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Dulce Vicio. Todos los derechos reservados.</p>
          <p>Defensa de las y los Consumidores. Para reclamos ingresá acá.</p>
        </div>
      </footer>

      {/* Modal del Botón de Arrepentimiento */}
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
                      placeholder="Ej. DV-94812"
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
                  Un representante de nuestro equipo te contactará por mail dentro de las próximas 24 horas hábiles 
                  para finalizar el proceso de reembolso.
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
