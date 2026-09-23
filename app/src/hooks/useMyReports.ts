import { useCallback, useEffect, useState } from "react";
import type { Report } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { useAuthUser } from "./useAuthUser";

// Sin `contact_phone_or_email`: esa columna solo la lee el dueño vía my_report_contact() (migración 0003).
export type MyReport = Pick<Report, "id" | "status" | "species" | "name" | "breed" | "photo_url" | "features_description" | "location_label" | "created_at" | "reunited_at">;
const COLS = "id,status,species,name,breed,photo_url,features_description,location_label,created_at,reunited_at";

export function useMyReports() {
  const uid = useAuthUser();
  const [reports, setReports] = useState<MyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase || !uid) { setReports([]); setLoading(false); return; }
    const { data, error: err } = await supabase.from("reports").select(COLS).eq("user_id", uid).order("created_at", { ascending: false });
    if (err) setError(err.message);
    else { setError(null); setReports((data ?? []) as MyReport[]); }
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
