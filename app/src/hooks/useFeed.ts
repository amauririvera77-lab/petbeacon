import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { readCache, writeCache } from "../lib/cache";
import { supabase } from "../lib/supabase";
import type { ReportNearby } from "../lib/database.types";
import { DEFAULT_CENTER } from "../lib/geo";

export const POLL_MS = 45_000;

type FeedOptions = {
  poll?: boolean;        // consulta novedades cada ~45 s (solo con la Home visible y la app en primer plano)
  onPoll?: () => void;   // se llama tras cada consulta buena (p. ej. para refrescar coincidencias y el badge)
};

type FeedState = {
  reports: ReportNearby[];
  loading: boolean;              // solo la PRIMERA carga (sin nada que mostrar): un refresco no vacía la lista
  error: string | null;          // solo si falló y no hay copia que mostrar
  lastUpdated: number | null;    // cuándo se sincronizaron por última vez los datos mostrados
  failed: boolean;               // el último intento falló (sin red o servidor caído): se muestran datos guardados
  pending: ReportNearby[] | null; // versión más reciente detectada por el polling, aún sin mostrar
  applyPending: () => void;
  refresh: () => Promise<void>;
};

// Orden y retención ya resueltos en SQL (reports_nearby / active_reports, CLAUDE.md §6).
// Fase 6: copia local (offline), polling de novedades SIN mover la lista (el usuario decide cuándo verlas) y carga inicial aparte.
export function useFeed(radiusMi: number, lat: number = DEFAULT_CENTER.lat, lng: number = DEFAULT_CENTER.lng, opts: FeedOptions = {}): FeedState {
  const [reports, setReports] = useState<ReportNearby[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<ReportNearby[] | null>(null);
  const cacheKey = `feed.${radiusMi}.${lat.toFixed(2)},${lng.toFixed(2)}`;
  const reportsRef = useRef<ReportNearby[]>([]);
  reportsRef.current = reports;
  const onPollRef = useRef(opts.onPoll);
  onPollRef.current = opts.onPoll;

  const refresh = useCallback(async () => {
    if (!supabase) { setLoaded(true); setError("supabase-not-configured"); return; }
    const { data, error: err } = await supabase.rpc("reports_nearby", { lat, lng, radius_mi: radiusMi });
    if (!err) {
      const rows = data ?? [];
      setReports(rows); setPending(null); setError(null); setFailed(false); setLoaded(true);
      setLastUpdated(await writeCache(cacheKey, rows));
      return;
    }
    // Falló: si hay algo que mostrar (en pantalla o guardado) se conserva y se avisa; si no, error con "Try again".
    setFailed(true);
    if (reportsRef.current.length === 0) {
      const c = await readCache<ReportNearby[]>(cacheKey);
      if (c) { setReports(c.data); setLastUpdated(c.savedAt); setLoaded(true); return; }
      setError(err.message);
    }
    setLoaded(true);
  }, [lat, lng, radiusMi, cacheKey]);

  // Al cambiar de radio/zona: primero lo guardado para ese radio (instantáneo) y luego la red.
  useEffect(() => {
    let alive = true;
    setLoaded(false); setPending(null);
    (async () => {
      const c = await readCache<ReportNearby[]>(cacheKey);
      if (alive && c) { setReports(c.data); setLastUpdated(c.savedAt); setLoaded(true); }
      else if (alive) setReports([]);
      if (alive) refresh();
    })();
    return () => { alive = false; };
  }, [cacheKey, refresh]);

  // Polling: guarda lo nuevo en `pending` en vez de reordenar la lista mientras el usuario la mira.
  const poll = opts.poll ?? false;
  useEffect(() => {
    if (!poll || !supabase) return;
    let alive = true;
    const tick = async () => {
      if (!alive || AppState.currentState !== "active" || !supabase) return;
      const { data, error: err } = await supabase.rpc("reports_nearby", { lat, lng, radius_mi: radiusMi });
      if (!alive || err || !data) return;
      setFailed(false);
      const have = new Set(reportsRef.current.map((r) => r.id));
      if (data.some((r) => !have.has(r.id))) setPending(data);
      writeCache(cacheKey, data).then((t) => alive && setLastUpdated(t));
      onPollRef.current?.();
    };
    const id = setInterval(tick, POLL_MS);
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") tick(); });
    return () => { alive = false; clearInterval(id); sub.remove(); };
  }, [poll, lat, lng, radiusMi, cacheKey]);

  const applyPending = useCallback(() => {
    setPending((p) => { if (p) { setReports(p); writeCache(cacheKey, p).then(setLastUpdated); } return null; });
  }, [cacheKey]);

  return { reports, loading: !loaded && reports.length === 0, error, lastUpdated, failed, pending, applyPending, refresh };
}
