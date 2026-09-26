// Horarios estructurados de un recurso (migración 0022): {"mon": [["09:00","17:00"]], …, "sun": …}. Sin el día o con una lista vacía = cerrado ese día.
export type OpeningHours = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", [string, string][]>>;
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const DAY_LABEL: Record<(typeof DAYS)[number], string> = { sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat" };

const toMin = (hm: string) => { const [h, m] = hm.split(":").map(Number); return h * 60 + (m || 0); };
// "09:00" → "9am", "13:30" → "1:30pm"
export const fmtHM = (hm: string): string => {
  const [h, m] = hm.split(":").map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 || h === 24 ? "am" : "pm"}`;
};

// Día de la semana y minutos desde medianoche en la zona horaria del RECURSO (no la del teléfono).
function localParts(now: number, tz: string): { day: number; min: number } {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    const h = Number(get("hour")) % 24;
    return { day: wd < 0 ? new Date(now).getDay() : wd, min: h * 60 + Number(get("minute")) };
  } catch {
    const d = new Date(now);
    return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
  }
}

export type OpenStatus = { open: boolean; label: string };

// "Open now" o "Closed · Opens 9am" (hoy más tarde), "Closed · Opens tomorrow 9am" o "Closed · Opens Mon 9am". null = sin horarios estructurados.
export function openStatus(hours: OpeningHours | null | undefined, tz = "America/New_York", now = Date.now()): OpenStatus | null {
  if (!hours || Object.keys(hours).length === 0) return null;
  const { day, min } = localParts(now, tz);
  const today = hours[DAYS[day]] ?? [];
  if (today.some(([a, b]) => min >= toMin(a) && min < toMin(b))) return { open: true, label: "Open now" };
  const later = today.filter(([a]) => toMin(a) > min).sort((x, y) => toMin(x[0]) - toMin(y[0]))[0];
  if (later) return { open: false, label: `Closed · Opens ${fmtHM(later[0])}` };
  for (let i = 1; i <= 7; i++) {
    const d = DAYS[(day + i) % 7];
    const first = [...(hours[d] ?? [])].sort((x, y) => toMin(x[0]) - toMin(y[0]))[0];
    if (first) return { open: false, label: `Closed · Opens ${i === 1 ? "tomorrow" : DAY_LABEL[d]} ${fmtHM(first[0])}` };
  }
  return { open: false, label: "Closed" };
}
