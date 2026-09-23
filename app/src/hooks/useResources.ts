import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ResourceNearby } from "../lib/database.types";
import { DEFAULT_CENTER } from "../lib/geo";

// Recursos comunitarios dentro del radio, con estado de carga/error (Support and care).
export function useResourcesState(radiusMi: number, lat: number = DEFAULT_CENTER.lat, lng: number = DEFAULT_CENTER.lng) {
  const [resources, setResources] = useState<ResourceNearby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); setError("supabase-not-configured"); return; }
    const { data, error: err } = await supabase.rpc("resources_nearby", { lat, lng, radius_mi: radiusMi });
    if (err) setError(err.message);
    else { setError(null); setResources(data ?? []); }
    setLoading(false);
  }, [lat, lng, radiusMi]);

  useEffect(() => { refresh(); }, [refresh]);
  return { resources, loading, error, refresh };
}

// Solo la lista (pines del mapa y tarjeta destacada de Home). Si la migración aún no está aplicada,
// falla en silencio y se muestran solo reportes.
export function useResources(radiusMi: number, lat: number = DEFAULT_CENTER.lat, lng: number = DEFAULT_CENTER.lng) {
  const { resources, error } = useResourcesState(radiusMi, lat, lng);
  if (error) console.warn("resources_nearby:", error);
  return resources;
}
