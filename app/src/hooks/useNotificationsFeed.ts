import { useMemo } from "react";
import type { MyMatch, ReportNearby } from "../lib/database.types";

export type NotifItem = {
  id: string;
  kind: "sighting" | "match" | "lost";
  title: string;
  at: number; // epoch ms
  reportId: string; // pin a seleccionar en el mapa
  dismissed?: boolean; // coincidencia descartada: sigue accesible aquí (fase 1.3)
};

const WINDOW = 48 * 3_600_000; // mismo horizonte que la retención de Sighted (§6)

// Lista in-app de novedades a partir de datos reales (no hay tabla de notificaciones): avistamientos y Lost
// cercanos de otros usuarios, y matches del usuario. El badge de la campana cuenta lo posterior a `seenAt`.
export function useNotificationsFeed(reports: ReportNearby[], matches: MyMatch[], myUid: string | null, seenAt: number) {
  return useMemo(() => {
    const now = Date.now();
    const items: NotifItem[] = [];
    for (const r of reports) {
      const at = new Date(r.created_at).getTime();
      if (now - at > WINDOW || r.status === "reunited") continue;
      items.push(r.status === "sighted"
        ? { id: `r-${r.id}`, kind: "sighting", title: "New sighting logged nearby", at, reportId: r.id }
        : { id: `r-${r.id}`, kind: "lost", title: `Lost ${r.species} reported nearby${r.name ? `: ${r.name}` : ""}`, at, reportId: r.id });
    }
    for (const m of matches) {
      const at = new Date(m.created_at).getTime();
      if (now - at > WINDOW) continue;
      items.push({ id: `m-${m.id}`, kind: "match", title: `Match update on ${m.lost_name ?? "your pet"}`, at, reportId: m.sighted_report_id, dismissed: m.dismissed });
    }
    items.sort((a, b) => b.at - a.at);
    const list = items.slice(0, 30);
    return { items: list, unread: list.filter((i) => i.at > seenAt).length };
  }, [reports, matches, myUid, seenAt]);
}
