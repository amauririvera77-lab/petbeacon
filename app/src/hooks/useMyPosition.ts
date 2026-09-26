import * as Location from "expo-location";
import { useEffect, useState } from "react";

// Ubicación actual del dispositivo, para el punto "tú" del mapa. Solo trabaja mientras `enabled` (mapa visible).
// Si el permiso aún no se decidió, se pide en contexto (al abrir el mapa); si está denegado, no hay punto y la app sigue igual.
export type PositionStatus = "idle" | "finding" | "ready" | "unavailable";

export function useMyPosition(enabled: boolean) {
  const [status, setStatus] = useState<PositionStatus>("idle");
  const [pos, setPos] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);

  useEffect(() => {
    if (!enabled) { setStatus((st) => (st === "finding" ? "idle" : st)); return; }
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted || !alive) { if (alive) setStatus("unavailable"); return; }
        setStatus((st) => (st === "ready" ? st : "finding"));
        // Si el GPS no responde en 20 s, se deja de mostrar "Finding your location…" (el mapa sigue en tu zona).
        timer = setTimeout(() => alive && setStatus((st) => (st === "finding" ? "unavailable" : st)), 20_000);
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (l) => {
          if (alive) { setStatus("ready"); setPos({ lat: l.coords.latitude, lng: l.coords.longitude, accuracy: l.coords.accuracy ?? null }); }
        });
      } catch (e) {
        console.warn("useMyPosition:", e instanceof Error ? e.message : e);
      }
    })();
    return () => { alive = false; if (timer) clearTimeout(timer); sub?.remove(); };
  }, [enabled]);

  return { pos, status };
}
