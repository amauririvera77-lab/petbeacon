import type { ReportNearby } from "./database.types";
import { supabase } from "./supabase";

// Busca un reporte por id con su distancia (para abrir su detalle cuando no está en el feed cargado, p. ej. desde una coincidencia).
export async function fetchReportNearby(id: string, lat: number, lng: number): Promise<ReportNearby | null> {
  if (!supabase) return null;
  const { data } = await supabase.rpc("reports_nearby", { lat, lng, radius_mi: 100 });
  return (data ?? []).find((r) => r.id === id) ?? null;
}
