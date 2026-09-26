import { eventWhen } from "./time";

// Eventos de Support and care (evaluación UX, fase E). Un evento tiene `event_date` (0011) y, con la migración 0013, hora de inicio y de fin
// (`event_starts_at`, `event_ends_at`). Sin horas estructuradas el evento dura todo su día `event_date`, como antes.
export type EventLike = { is_featured_event: boolean; event_date?: string | null; event_starts_at?: string | null; event_ends_at?: string | null };
export type EventPhase = "live" | "today" | "future" | "past";

const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const endOfLocalDay = (key: string) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, 23, 59, 59, 999).getTime(); };

function window(r: EventLike): { start: number | null; end: number; day: string } | null {
  const start = r.event_starts_at ? Date.parse(r.event_starts_at) : null;
  const day = r.event_date ?? (start != null ? dateKey(new Date(start)) : null);
  const end = r.event_ends_at ? Date.parse(r.event_ends_at) : day ? endOfLocalDay(day) : null;
  if (end == null || Number.isNaN(end) || !day) return null;
  return { start: start != null && !Number.isNaN(start) ? start : null, end, day };
}

// null = no es un evento (o no tiene fecha, así que no se puede saber si está vigente).
export function eventPhase(r: EventLike, now = Date.now()): EventPhase | null {
  if (!r.is_featured_event) return null;
  const w = window(r);
  if (!w) return null;
  if (now >= w.end) return "past";
  if (w.start != null && now >= w.start) return "live";
  return w.day === dateKey(new Date(now)) ? "today" : "future";
}

// Eventos vigentes (en curso, hoy o futuros), en curso primero y luego por cercanía en el tiempo. Un evento terminado desaparece
// de aquí en el momento en que pasa su hora de fin (o al terminar su día, si no tiene horas).
export function activeEvents<T extends EventLike & { distance_mi?: number }>(list: T[], now = Date.now()): T[] {
  const rank = { live: 0, today: 1, future: 2 } as const;
  const start = (r: T) => { const w = window(r); return w ? (w.start ?? w.end) : Infinity; };
  return list
    .filter((r) => { const p = eventPhase(r, now); return p === "live" || p === "today" || p === "future"; })
    .sort((a, b) => rank[eventPhase(a, now) as "live" | "today" | "future"] - rank[eventPhase(b, now) as "live" | "today" | "future"] || start(a) - start(b) || (a.distance_mi ?? 0) - (b.distance_mi ?? 0));
}

// "9am", "1pm", "1:30pm"
export function clock(ms: number): string {
  const d = new Date(ms), h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

// Texto de estado del evento (E.1):
//   en curso            → "Happening now · until 1pm"
//   hoy, sin empezar    → "Today · 9am–1pm"
//   otro día            → el formato de siempre ("This Saturday, Oct 3 · 9am–1pm")
export function eventLabel(r: EventLike & { hours?: string | null }, now = Date.now()): string | null {
  const phase = eventPhase(r, now), w = window(r);
  if (phase === "live" && w) return `Happening now · until ${clock(w.end)}`;
  if (phase === "today" && w) {
    if (w.start != null && r.event_ends_at) return `Today · ${clock(w.start)}–${clock(w.end)}`;
    const t = r.hours && r.hours.includes(",") ? r.hours.replace(/^[^,]*,\s*/, "") : null; // sin horas estructuradas: el rango del texto libre
    if (t) return `Today · ${t}`;
  }
  return eventWhen(r.event_date, r.hours ?? null, new Date(now));
}

// ¿Es un evento vigente (en curso, hoy o futuro)? Un evento terminado se trata como un recurso normal.
export const isActiveEvent = (r: EventLike, now = Date.now()): boolean => { const p = eventPhase(r, now); return p === "live" || p === "today" || p === "future"; };
