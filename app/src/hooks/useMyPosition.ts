import * as Location from "expo-location";
import { useEffect, useState } from "react";

// Ubicación actual del dispositivo, para el punto "tú" del mapa. Solo trabaja mientras `enabled` (mapa visible).
// Si el permiso aún no se decidió, se pide en contexto (al abrir el mapa); si está denegado, no hay punto y la app sigue igual.
export function useMyPosition(enabled: boolean) {
  const [pos, setPos] = useState<{ lat: number; lng: number; accuracy: number | null } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      try {
        let perm = await Location.getForegroundPermissionsAsync();
        if (!perm.granted && perm.canAskAgain) perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted || !alive) return;
        sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 10 }, (l) => {
          if (alive) setPos({ lat: l.coords.latitude, lng: l.coords.longitude, accuracy: l.coords.accuracy ?? null });
        });
      } catch (e) {
        console.warn("useMyPosition:", e instanceof Error ? e.message : e);
      }
    })();
    return () => { alive = false; sub?.remove(); };
  }, [enabled]);

  return pos;
}
