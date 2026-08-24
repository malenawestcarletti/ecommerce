import React from 'react';

export default function ProductCard({ producto }) {
  // Helper para dar formato de moneda argentina
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(valor);
  };

  return (
    <article className="product-card" id={`product-card-${producto.id}`}>
      <div className="product-info">
        <h3 className="product-name">{producto.nombre}</h3>
        <p className="product-price">{formatearMoneda(producto.precio_final)}</p>
        
        {producto.cuotas_cantidad > 1 ? (
          <p className="product-installments">
            {producto.cuotas_cantidad} cuotas sin interés de {formatearMoneda(producto.cuotas_valor)}
          </p>
        ) : (
          <p className="product-installments" style={{ color: '#6e584d' }}>
            Pago único
          </p>
        )}

        <div className="product-meta">
          <span>Garantía: {producto.garantia_meses > 0 ? `${producto.garantia_meses} meses` : 'Frescura garantizada'}</span>
          <span className={`stock-tag ${producto.stock > 0 ? 'in-stock' : 'out-stock'}`}>
            {producto.stock > 0 ? `${producto.stock} disp.` : 'Sin Stock'}
          </span>
        </div>

        <button className="btn btn-secondary" style={{ marginTop: '1rem', width: '100%' }} id={`btn-add-cart-${producto.id}`}>
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
