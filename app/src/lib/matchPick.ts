import type { MyMatch } from "./database.types";

// Coincidencia que muestra la tarjeta de estado (fase 2, punto 5): entre las NO descartadas, la más fuerte (strong antes que possible);
// a igual fuerza, la más reciente (por fecha del avistamiento).
export function pickPending(matches: MyMatch[]): MyMatch | undefined {
  const t = (m: MyMatch) => new Date(m.sighted_created_at ?? m.created_at).getTime();
  return matches
    .filter((m) => !m.dismissed)
    .sort((a, b) => Number(b.confidence === "strong") - Number(a.confidence === "strong") || t(b) - t(a))[0];
}
