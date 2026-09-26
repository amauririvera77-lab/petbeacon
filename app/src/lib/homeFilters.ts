import type { ReportNearby } from "./database.types";
import { DEFAULT_PREFS, Prefs } from "../state/homePrefs";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Filtros de la Home (fase 4.3), iguales para List y Map. La búsqueda de texto solo aplica a List (en Map la búsqueda es una dirección).
export function applyHomeFilters<T extends ReportNearby>(reports: T[], prefs: Prefs, query = "", now = Date.now()): T[] {
  const tokens = norm(query).split(/\s+/).filter(Boolean);
  const maxAge = prefs.age === "24h" ? 24 * 3_600_000 : prefs.age === "7d" ? 7 * 24 * 3_600_000 : Infinity;
  return reports.filter((r) => {
    if (r.status === "lost" && !prefs.lost) return false;
    if (r.status === "sighted" && !prefs.sighted) return false;
    if (r.status === "reunited" && !prefs.showReunited) return false;
    if (prefs.species !== "all" && r.species !== prefs.species) return false;
    if (r.distance_mi > prefs.viewRadiusMi) return false;
    if (now - new Date(r.created_at).getTime() > maxAge) return false;
    if (tokens.length) {
      const hay = norm([r.name, r.breed, r.features_description, r.location_label, r.species].filter(Boolean).join(" "));
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

// Filtros de la HOJA distintos de sus valores por defecto (badge del botón de filtros). Los chips Lost/Sighted son visibles fuera de la hoja.
export function activeFilterCount(p: Prefs): number {
  return [p.species !== DEFAULT_PREFS.species, p.viewRadiusMi !== DEFAULT_PREFS.viewRadiusMi, p.age !== DEFAULT_PREFS.age, p.showReunited !== DEFAULT_PREFS.showReunited]
    .filter(Boolean).length;
}
