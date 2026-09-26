import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "../lib/cache";
import { supabase } from "../lib/supabase";
import type { ResourceNearby } from "../lib/database.types";
import { DEFAULT_CENTER } from "../lib/geo";

// Recursos comunitarios dentro del radio, con estado de carga/error (Support and care).
export function useResourcesState(radiusMi: number, lat: number = DEFAULT_CENTER.lat, lng: number = DEFAULT_CENTER.lng) {
  const [resources, setResources] = useState<ResourceNearby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `resources.${radiusMi}.${lat.toFixed(2)},${lng.toFixed(2)}`;
  const haveRef = useRef(false);

  // Con la última copia buena como respaldo: sin conexión se siguen mostrando los recursos guardados (fase 6.3).
  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); setError("supabase-not-configured"); return; }
    const { data, error: err } = await supabase.rpc("resources_nearby", { lat, lng, radius_mi: radiusMi });
    if (!err) { haveRef.current = true; setError(null); setResources(data ?? []); writeCache(key, data ?? []); }
    else if (!haveRef.current) {
      const c = await readCache<ResourceNearby[]>(key);
      if (c) { haveRef.current = true; setResources(c.data); setError(null); } else setError(err.message);
    }
    setLoading(false);
  }, [lat, lng, radiusMi, key]);

  useEffect(() => { haveRef.current = false; refresh(); }, [refresh]);
  return { resources, loading, error, refresh };
}

// Solo la lista (pines del mapa y tarjeta destacada de Home). Si la migración aún no está aplicada,
// falla en silencio y se muestran solo reportes.
export function useResources(radiusMi: number, lat: number = DEFAULT_CENTER.lat, lng: number = DEFAULT_CENTER.lng) {
  const { resources, error } = useResourcesState(radiusMi, lat, lng);
  if (error) console.warn("resources_nearby:", error);
  return resources;
}
