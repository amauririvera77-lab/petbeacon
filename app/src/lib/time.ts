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
