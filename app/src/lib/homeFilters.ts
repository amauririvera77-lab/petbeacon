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

// Filtros de la HOJA distintos de sus valores por defecto: especie, antigüedad y "Show reunited". El RADIO no cuenta como filtro (se muestra
// junto al conteo de la lista: "10 reports within 10 mi") y los chips Lost/Sighted son visibles fuera de la hoja.
export type ActiveFilterChip = { key: "species" | "age" | "showReunited"; label: string; clear: Partial<Prefs> };
const SPECIES_LABEL: Record<"dog" | "cat" | "other", string> = { dog: "Dogs only", cat: "Cats only", other: "Other pets only" };
export function activeFilterChips(p: Prefs): ActiveFilterChip[] {
  const out: ActiveFilterChip[] = [];
  if (p.species !== "all") out.push({ key: "species", label: SPECIES_LABEL[p.species], clear: { species: DEFAULT_PREFS.species } });
  if (p.age !== DEFAULT_PREFS.age) out.push({ key: "age", label: p.age === "24h" ? "Last 24h" : "Last 7 days", clear: { age: DEFAULT_PREFS.age } });
  if (p.showReunited !== DEFAULT_PREFS.showReunited) out.push({ key: "showReunited", label: "Incl. reunited", clear: { showReunited: DEFAULT_PREFS.showReunited } });
  return out;
}
export const activeFilterCount = (p: Prefs): number => activeFilterChips(p).length;

// "YYYY-MM-DD" de hoy en la zona horaria del dispositivo (event_date es una fecha de calendario, sin hora).
export function localDateKey(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0"), d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

// Pines de recurso del mapa de Home: SOLO eventos (is_featured_event) con event_date de hoy o futura. Un evento pasado, o sin fecha
// real, no se muestra; el resto de recursos (clínicas, legal, foster…) vive solo en Support and care.
export function mapEventResources<T extends { is_featured_event: boolean; event_date?: string | null }>(resources: T[], now = new Date()): T[] {
  const today = localDateKey(now);
  return resources.filter((r) => r.is_featured_event && !!r.event_date && r.event_date >= today);
}
