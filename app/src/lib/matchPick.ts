import type { MyMatch } from "./database.types";
import { matchStrength } from "./matchCopy";

// Coincidencia que muestra la tarjeta de estado (fase 2, punto 5): entre las NO descartadas, la más fuerte (strong antes que possible);
// a igual fuerza, la más reciente (por fecha del avistamiento).
export function pickPending(matches: MyMatch[]): MyMatch | undefined {
  const t = (m: MyMatch) => new Date(m.sighted_created_at ?? m.created_at).getTime();
  return matches
    .filter((m) => !m.dismissed)
    .sort((a, b) => Number(matchStrength(b) === "strong") - Number(matchStrength(a) === "strong") || t(b) - t(a))[0];
}

// Avistamiento → nombre de la mascota con la que coincide (solo coincidencias NO descartadas; si un avistamiento coincide con varias,
// gana la más fuerte). Sirve para la etiqueta "Match for [pet]" en el feed y el indicador del pin. Solo existe para el dueño: my_matches()
// devuelve únicamente las coincidencias de sus propios reportes.
export function matchNamesBySighting(matches: MyMatch[]): Record<string, string> {
  const out: Record<string, string> = {};
  const t = (m: MyMatch) => new Date(m.sighted_created_at ?? m.created_at).getTime();
  [...matches].filter((m) => !m.dismissed)
    .sort((a, b) => Number(matchStrength(a) === "strong") - Number(matchStrength(b) === "strong") || t(a) - t(b)) // la más fuerte queda al final y pisa a las demás
    .forEach((m) => { out[m.sighted_report_id] = m.lost_name?.trim() || "your pet"; });
  return out;
}

// Orden del carrusel de estado (evaluación UX, B.1): primero los reportes con coincidencias NO descartadas (strong antes que possible),
// luego el resto; a igual relevancia, el más reciente (por fecha de la pérdida) primero.
export function sortByRelevance<T extends { id: string; created_at: string }>(reports: T[], matches: MyMatch[]): T[] {
  const rank = (id: string) => {
    const open = matches.filter((m) => m.lost_report_id === id && !m.dismissed);
    return open.some((m) => matchStrength(m) === "strong") ? 2 : open.length > 0 ? 1 : 0;
  };
  return [...reports].sort((a, b) => rank(b.id) - rank(a.id) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}
