import { useEffect } from "react";
import { geocodeCity } from "../lib/geocode";
import { DEFAULT_CENTER, LatLng } from "../lib/geo";
import { useSession } from "../state/session";

// Centro del feed y del mapa: GPS del onboarding, o la ciudad del registro geocodificada una sola vez.
// Si nada resuelve, cae al centro por defecto (donde está el seed).
export function useHome(): LatLng {
  const { home, city, hydrated, update } = useSession();
  useEffect(() => {
    if (!hydrated || home || !city.trim()) return;
    let alive = true;
    geocodeCity(city).then((c) => { if (alive && c) update({ home: c }); });
    return () => { alive = false; };
  }, [hydrated, home, city, update]);
  return home ?? DEFAULT_CENTER;
}
