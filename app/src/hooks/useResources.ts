import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { ResourceNearby } from "../lib/database.types";
import { DEFAULT_CENTER } from "../lib/geo";

// Recursos comunitarios dentro del radio (para los pines de corazón del mapa).
// Si la migración 0002 aún no está aplicada, falla en silencio y el mapa muestra solo reportes.
export function useResources(radiusMi: number, lat: number = DEFAULT_CENTER.lat, lng: number = DEFAULT_CENTER.lng) {
  const [resources, setResources] = useState<ResourceNearby[]>([]);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.rpc("resources_nearby", { lat, lng, radius_mi: radiusMi }).then(({ data, error }) => {
      if (!alive) return;
      if (error) console.warn("resources_nearby:", error.message);
      else setResources(data ?? []);
    });
    return () => { alive = false; };
  }, [lat, lng, radiusMi]);
  return resources;
}
