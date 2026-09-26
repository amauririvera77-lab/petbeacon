import { useEffect, useState } from "react";

// Reloj que se actualiza solo (por defecto cada 30 s): para que un evento "en curso" o "terminado" cambie sin recargar la pantalla.
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
