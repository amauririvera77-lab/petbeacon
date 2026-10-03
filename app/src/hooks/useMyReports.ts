import { useCallback, useEffect, useRef, useState } from "react";
import type { Report } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { useAuthUser } from "./useAuthUser";

// Sin `contact_phone_or_email`: esa columna solo la lee el dueño vía my_report_contact() (migración 0003).
// Columnas opcionales por migración (se descartan si la base aún no las tiene): alerted_count (0010), condición/color/tamaño (0012/0017)
// y last_seen_at/resolution/resolved_at (0020).
export type MyReport = Pick<Report, "id" | "status" | "species" | "name" | "breed" | "breed_id" | "photo_url" | "photo_focus_x" | "photo_focus_y" | "photo_zoom" | "features_description" | "location_label" | "location" | "created_at" | "reunited_at" | "pet_id">
  & { alerted_count?: number | null; condition?: Report["condition"]; color?: string | null; size?: Report["size"]; last_seen_at?: string | null; resolution?: Report["resolution"]; resolved_at?: string | null };
const COLS_BASE = "id,status,species,name,breed,breed_id,photo_url,photo_focus_x,photo_focus_y,photo_zoom,features_description,location_label,location,created_at,reunited_at,pet_id";
const OPTIONAL_GROUPS = ["alerted_count", "condition", "color,size", "last_seen_at,resolution,resolved_at"] as const;

export function useMyReports() {
  const uid = useAuthUser();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const skipped = useRef<Set<string>>(new Set()); // grupos de columnas que la base aún no tiene

  const refresh = useCallback(async () => {
    if (!supabase || !uid) { setReports([]); setLoading(false); return; }
    const q = (cols: string) => supabase!.from("reports").select(cols).eq("user_id", uid).order("created_at", { ascending: false });
    let data: unknown = null, err: { message: string } | null = null;
    for (let i = 0; i <= OPTIONAL_GROUPS.length; i++) {
      const cols = [COLS_BASE, ...OPTIONAL_GROUPS.filter((g) => !skipped.current.has(g))].join(",");
      ({ data, error: err } = await q(cols));
      if (!err) break;
      // Si el error nombra una columna opcional que no existe, se descarta ese grupo y se reintenta.
      const bad = OPTIONAL_GROUPS.find((g) => !skipped.current.has(g) && g.split(",").some((c) => new RegExp(`\\b${c}\\b`, "i").test(err!.message)));
      if (!bad) break;
      skipped.current.add(bad);
    }
    if (err) setError(err.message);
    else { setError(null); setReports((data ?? []) as unknown as MyReport[]); }
    setLoading(false);
  }, [uid]);

  useEffect(() => { refresh(); }, [refresh]);

  // Cierra el caso: sale del mapa público y del feed a las 24h (retención de §6).
  const markReunited = useCallback(async (id: string) => {
    if (!supabase) return;
    const { error: err } = await supabase.from("reports").update({ status: "reunited", reunited_at: new Date().toISOString() }).eq("id", id);
    if (err) throw new Error(err.message);
    await refresh();
  }, [refresh]);

  return { reports, loading, error, refresh, markReunited };
}
