import type { ResourceNearby } from "./database.types";

export const webUrl = (site: string | null) => (site ? (/^https?:\/\//.test(site) ? site : `https://${site}`) : null);

// ── Datos de muestra (Support and care 5.1) ───────────────────────────────────────────────────────────────────────────
// Un recurso con is_sample = true es ficticio: se etiqueta "Sample data" y sus acciones externas (llamar, WhatsApp, web, direcciones) quedan
// deshabilitadas. Antes de aplicar la migración 0022 el campo no existe y se trata como recurso real.
export const isSample = (r: Pick<ResourceNearby, "is_sample">): boolean => r.is_sample === true;

// ── Etiquetas (5.4) ─────────────────────────────────────────────────────────────────────────────────────────────────────
export const TAG_LABEL: Record<string, string> = { free: "Free", low_cost: "Low cost", income_based: "Income-based", walk_ins: "Walk-ins welcome" };
export const tagLabels = (r: Pick<ResourceNearby, "tags">): string[] => (r.tags ?? []).map((t) => TAG_LABEL[t]).filter(Boolean);

// ── Acción principal según el tipo de recurso (5.3) ─────────────────────────────────────────────────────────────────────
//   evento en curso o próximo           → "Get directions"
//   atención presencial (clínicas…)     → "Contact" (la hoja con todas las opciones)
//   fondos o programas sin atención     → "Learn more" (web) o, sin web, "Contact"
export type ResourceActionKind = "directions" | "learn" | "contact";
export function resourceActionKind(r: Pick<ResourceNearby, "in_person" | "website_url">, isEvent: boolean): ResourceActionKind {
  if (isEvent) return "directions";
  if (r.in_person !== false) return "contact";
  return webUrl(r.website_url) ? "learn" : "contact";
}

// Orden de la lista (5.5 "Support Before Surrender"): los recursos de entrega o ingreso a refugio van SIEMPRE al final, después de los demás;
// dentro de cada grupo se conserva el orden que traía (eventos vigentes primero y luego por distancia).
export function supportOrder<T extends Pick<ResourceNearby, "category">>(list: T[]): T[] {
  return [...list.filter((r) => r.category !== "shelter"), ...list.filter((r) => r.category === "shelter")];
}
