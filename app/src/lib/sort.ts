import { activityMs } from "./activity";
import type { ReportNearby } from "./database.types";

export type SortMode = "recent" | "nearest";
export const SORT_LABEL: Record<SortMode, string> = { recent: "Most recent", nearest: "Nearest" };

// Orden del feed (fase 3.1): por defecto los más recientes primero, dentro del radio del usuario. Empates → el más cercano / reciente.
export function sortReports<T extends Pick<ReportNearby, "created_at" | "last_seen_at" | "distance_mi">>(reports: T[], mode: SortMode): T[] {
  const t = (r: T) => activityMs(r); // un avistamiento con "Still there" cuenta desde esa hora
  return [...reports].sort(mode === "nearest"
    ? (a, b) => a.distance_mi - b.distance_mi || t(b) - t(a)
    : (a, b) => t(b) - t(a) || a.distance_mi - b.distance_mi);
}
