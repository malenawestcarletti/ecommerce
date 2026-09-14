import React, { createContext, useContext, useState, useEffect } from "react";

const CarritoContext = createContext();

export function CarritoProvider({ children }) {
  // Inicialización perezosa con try/catch para evitar que un JSON corrupto rompa la app
  const [items, setItems] = useState(() => {
    try {
      const guardado = localStorage.getItem("carrito_items");
      if (!guardado) return [];
      const parsed = JSON.parse(guardado);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn("JSON de carrito corrupto en localStorage. Reiniciando carrito vacío.", error);
      return [];
    }
  });

  // Guardar en localStorage cada vez que el carrito cambie
  useEffect(() => {
    try {
      localStorage.setItem("carrito_items", JSON.stringify(items));
    } catch (error) {
      console.error("Error al persistir carrito en localStorage:", error);
    }
  }, [items]);

  // Agregar producto: si ya está, suma la cantidad sin duplicar fila
  const agregar = (producto, cantidad = 1) => {
    if (!producto || !producto.id) return;
    const cantNum = Math.max(1, parseInt(cantidad, 10) || 1);

    setItems((prevItems) => {
      const indiceExistente = prevItems.findIndex(
        (item) => item.producto.id === producto.id
      );

      if (indiceExistente >= 0) {
        return prevItems.map((item, index) => {
          if (index === indiceExistente) {
            return {
              ...item,
              cantidad: item.cantidad + cantNum,
            };
          }
          return item;
        });
      }

      return [...prevItems, { producto, cantidad: cantNum }];
    });
  };

  // Quitar producto por su ID
  const quitar = (producto_id) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.producto.id !== producto_id)
    );
  };

  // Vaciar completamente el carrito
  const vaciar = () => {
    setItems([]);
  };

  // Total calculado con reduce
  const total = items.reduce((acum, item) => {
    const precio = Number(item.producto.precio_final) || 0;
    return acum + precio * item.cantidad;
  }, 0);

  return (
    <CarritoContext.Provider
      value={{
        items,
        agregar,
        quitar,
        vaciar,
        total,
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
}

export function useCarrito() {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error("useCarrito debe ser utilizado dentro de un CarritoProvider");
  }
  return context;
}
