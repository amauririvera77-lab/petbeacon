import { useCallback, useEffect, useRef, useState } from "react";
import type { Report } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { useAuthUser } from "./useAuthUser";

// Sin `contact_phone_or_email`: esa columna solo la lee el dueño vía my_report_contact() (migración 0003).
// alerted_count: número de vecinos alertados por push (migración 0010). Es null/ausente en reportes anteriores o antes de aplicarla.
export type MyReport = Pick<Report, "id" | "status" | "species" | "name" | "breed" | "photo_url" | "photo_focus_x" | "photo_focus_y" | "photo_zoom" | "features_description" | "location_label" | "created_at" | "reunited_at"> & { alerted_count?: number | null };
const COLS_BASE = "id,status,species,name,breed,photo_url,photo_focus_x,photo_focus_y,photo_zoom,features_description,location_label,created_at,reunited_at";
const COLS_WITH_COUNT = `${COLS_BASE},alerted_count`;

export function useMyReports() {
  const uid = useAuthUser();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasCount = useRef(true); // se apaga si la base aún no tiene la columna alerted_count

  const refresh = useCallback(async () => {
    if (!supabase || !uid) { setReports([]); setLoading(false); return; }
    const q = (cols: string) => supabase!.from("reports").select(cols).eq("user_id", uid).order("created_at", { ascending: false });
    let { data, error: err } = await q(hasCount.current ? COLS_WITH_COUNT : COLS_BASE);
    if (err && hasCount.current && /alerted_count/i.test(err.message)) {
      hasCount.current = false;
      ({ data, error: err } = await q(COLS_BASE));
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
