// Escala de radios ÚNICA (Profile 3.4): el radio de alertas del perfil y el radio de visualización de la Home usan las mismas opciones.
export const RADIUS_OPTIONS = [1, 3, 5, 10] as const;
export type RadiusMi = (typeof RADIUS_OPTIONS)[number];

// Valor más cercano de la escala; en un empate (2 → 3, 4 → 5) gana el mayor para no reducir la cobertura. El 6 antiguo pasa a 5.
// Mismo criterio que la migración 0018.
export function snapRadius(v: number | null | undefined): RadiusMi {
  if (v == null || Number.isNaN(v)) return 5;
  let best: RadiusMi = RADIUS_OPTIONS[0];
  let bestD = Infinity;
  for (const o of RADIUS_OPTIONS) {
    const d = Math.abs(o - v);
    if (d < bestD || (d === bestD && o > best)) { best = o; bestD = d; }
  }
  return best;
}

export const nextRadius = (v: number): RadiusMi | null => RADIUS_OPTIONS.find((o) => o > v) ?? null;
