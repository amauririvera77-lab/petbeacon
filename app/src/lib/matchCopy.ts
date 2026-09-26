import type { MyMatch } from "./database.types";
import { agoShort } from "./time";

// Texto de una coincidencia (fase 1.2): explica POR QUÉ se sugiere, no solo la raza.
//   "Possible match for Max"
//   "Similar dog seen 0.9 mi from where Max was lost · 1h ago"
// "Strong" (misma raza) usa "Same-breed". Si la migración 0009 aún no está aplicada faltan distancia y motivos: se degrada sin inventar datos.
// Fuerza EFECTIVA (evaluación UX, A.1): sin foto del avistamiento el dueño no puede confirmarla, así que nunca es "strong". La regla vive
// en el trigger (migración 0012); este tope hace que también se cumpla con coincidencias anteriores o si la migración aún no se aplicó.
export const matchStrength = (m: MyMatch): "strong" | "possible" => (m.confidence === "strong" && !!m.sighted_photo_url ? "strong" : "possible");

export const matchTitle = (m: MyMatch) => `${matchStrength(m) === "strong" ? "Strong" : "Possible"} match for ${m.lost_name ?? "your pet"}`;

export function matchSubtitle(m: MyMatch): string {
  const name = m.lost_name ?? "your pet";
  const kind = matchStrength(m) === "strong" ? "Same-breed" : "Similar";
  const animal = m.sighted_species && m.sighted_species !== "other" ? m.sighted_species : "pet";
  const dist = m.distance_mi ?? m.reasons?.distance_mi;
  const where = dist != null ? `${dist.toFixed(1)} mi from where ${name} was lost` : m.sighted_label ? `near ${m.sighted_label}` : "nearby";
  const when = m.sighted_created_at ? ` · ${agoShort(m.sighted_created_at)}` : "";
  return `${kind} ${animal} seen ${where}${when}`;
}
