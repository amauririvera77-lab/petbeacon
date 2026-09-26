// Hora de la ÚLTIMA actividad de un reporte: para un avistamiento, la de "Still there" (last_seen_at) si existe; si no, cuando se creó.
// La retención del feed, el orden y las etiquetas de tiempo usan esta hora; created_at sigue siendo la hora original del reporte.
export const activityAt = (r: { created_at: string; last_seen_at?: string | null }): string => r.last_seen_at ?? r.created_at;
export const activityMs = (r: { created_at: string; last_seen_at?: string | null }): number => new Date(activityAt(r)).getTime();
