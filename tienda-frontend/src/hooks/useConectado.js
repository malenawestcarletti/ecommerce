import { useState, useEffect } from "react";

export function useConectado() {
  const [conectado, setConectado] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setConectado(true);
    const handleOffline = () => setConectado(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return conectado;
}

export default useConectado;
