import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../AppText";
import type { MyReport } from "../../hooks/useMyReports";
import { pastDate, pastResult } from "../../lib/myReports";
import { REPORT_KIND_LABEL, reportKind, reportTitle } from "../../lib/reportText";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { FocusImage } from "../FocusImage";
import { SpeciesPlaceholder } from "../SpeciesPlaceholder";

const fmt = (ms: number) => new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });

// Historial plegado (My Reports 4.8): reunidos, resueltos, cerrados y avistamientos vencidos, cada uno con su tipo ("Lost pet" / "Sighting"),
// su resultado y su fecha. El título sigue la misma regla que el resto de la app (reportTitle: por origen del reporte, no por su estado literal).
export function PastReports({ reports }: { reports: MyReport[] }) {
  const [open, setOpen] = useState(false);
  if (reports.length === 0) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={styles.head}>
        <AppText style={styles.h}>Past reports ({reports.length})</AppText>
        <View style={open && { transform: [{ rotate: "180deg" }] }}><ChevronDown size={20} color={Theme.text.muted} /></View>
      </Pressable>
      {open ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          {reports.map((r) => (
            <View key={r.id} style={styles.row}>
              {r.photo_url ? <FocusImage uri={r.photo_url} focusX={r.photo_focus_x} focusY={r.photo_focus_y} style={styles.thumb} /> : <SpeciesPlaceholder species={r.species} size={48} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={styles.title} numberOfLines={1}>{reportTitle(r)}</AppText>
                <View style={styles.resultRow}>
                  <View style={styles.kindTag}><AppText role="control" style={styles.kindT}>{REPORT_KIND_LABEL[reportKind(r.status)]}</AppText></View>
                  <AppText style={styles.result} numberOfLines={1}>{pastResult(r)} · {fmt(pastDate(r))}</AppText>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  head: { minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { ...typography.heading18, color: Theme.text.primary },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: Theme.surface.page },
  title: { ...typography.heading16, color: Theme.text.primary },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexShrink: 1 },
  kindTag: { flexShrink: 0, paddingHorizontal: 6, height: 18, borderRadius: radius.pill, backgroundColor: Theme.surface.page, borderWidth: 1, borderColor: Theme.border.strong, alignItems: "center", justifyContent: "center" },
  kindT: { ...typography.badge12, color: Theme.text.secondary },
  result: { flexShrink: 1, ...typography.bodySm13, color: Theme.text.secondary },
});
