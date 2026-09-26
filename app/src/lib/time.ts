// Tiempo relativo corto para tarjetas y avisos: "Just now", "30m ago", "1h ago", "2d ago".
export function agoShort(iso: string, now = Date.now()): string {
  const m = Math.floor((now - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Duración desde una fecha, sin "ago": "25m", "3h", "2d" (para "Missing for 3h").
export function elapsedShort(iso: string, now = Date.now()): string {
  const m = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (m < 1) return "under a minute";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Fecha de un evento con la relativa Y la concreta: "This Saturday, Oct 3 · 9am–1pm" (fase 3.4).
// Sin fecha real (antes de la migración 0011) se muestra el texto de `hours` tal cual, sin inventar nada.
export function eventWhen(eventDate?: string | null, hours?: string | null, now = new Date()): string | null {
  if (!eventDate) return hours ?? null;
  const [y, m, d] = eventDate.split("-").map(Number);
  if (!y || !m || !d) return hours ?? null;
  const day = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const weekday = DAYS[day.getDay()];
  const rel = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff > 1 && diff < 7 ? `This ${weekday}` : weekday;
  const time = hours && hours.includes(",") ? hours.replace(/^[^,]*,\s*/, "") : null; // "This Saturday, 9am–1pm" → "9am–1pm"
  return `${rel}, ${MONTHS[day.getMonth()]} ${day.getDate()}${time ? ` · ${time}` : ""}`;
}

// "Today, 8:40 AM" / "Yesterday, 6:30 PM" / "Oct 3, 9:15 AM": momento concreto de un reporte.
export function whenLabel(iso: string, now = new Date()): string {
  const d = new Date(iso), y = new Date(now); y.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return `${same(d, now) ? "Today" : same(d, y) ? "Yesterday" : d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

// "just now", "5 min ago", "2 hr ago", "3 days ago": para "Last updated …" (sin abreviar tanto como agoShort).
export function agoLong(at: number, now = Date.now()): string {
  const m = Math.max(0, Math.floor((now - at) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}
