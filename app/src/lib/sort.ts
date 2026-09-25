import type { ReportNearby } from "./database.types";

export type SortMode = "recent" | "nearest";
export const SORT_LABEL: Record<SortMode, string> = { recent: "Most recent", nearest: "Nearest" };

// Orden del feed (fase 3.1): por defecto los más recientes primero, dentro del radio del usuario. Empates → el más cercano / reciente.
export function sortReports<T extends Pick<ReportNearby, "created_at" | "distance_mi">>(reports: T[], mode: SortMode): T[] {
  const t = (r: T) => new Date(r.created_at).getTime();
  return [...reports].sort(mode === "nearest"
    ? (a, b) => a.distance_mi - b.distance_mi || t(b) - t(a)
    : (a, b) => t(b) - t(a) || a.distance_mi - b.distance_mi);
}
