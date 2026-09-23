import { useCallback, useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "../lib/supabase";
import type { ReportNearby } from "../lib/database.types";
import { DEFAULT_CENTER } from "../lib/geo";


type FeedState = {
  reports: ReportNearby[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

// Orden y retención ya resueltos en SQL (reports_nearby / active_reports, CLAUDE.md §6):
// Lost prioritario en 72h y sin expirar; Sighted se retira a las 48h; Reunited a las 24h.
export function useFeed(radiusMi: number, lat: number = DEFAULT_CENTER.lat, lng: number = DEFAULT_CENTER.lng): FeedState {
  const [reports, setReports] = useState<ReportNearby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setError("supabase-not-configured");
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.rpc("reports_nearby", { lat, lng, radius_mi: radiusMi });
    if (err) setError(err.message);
    else setReports(data ?? []);
    setLoading(false);
  }, [lat, lng, radiusMi]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { reports, loading, error, refresh };
}
