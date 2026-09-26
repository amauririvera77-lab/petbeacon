import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MyReport } from "../hooks/useMyReports";
import { C, MIN_HIT, font, radius } from "../theme/tokens";
import { Badge, type BadgeStatus } from "./Badge";
import { FocusImage } from "./FocusImage";

function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function MyReportCard({ report, matchCount, onMatches, onEdit, onMarkReunited }: { report: MyReport; matchCount: number; onMatches?: () => void; onEdit?: () => void; onMarkReunited?: () => void }) {
  const title = report.name?.trim() || `Unknown ${report.species}`;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {report.photo_url ? <FocusImage uri={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} zoom={(report.photo_zoom ?? 100) / 100} style={styles.photo} /> : (
          <View style={[styles.photo, styles.fallback]}><Text style={styles.fallbackT}>{title[0]?.toUpperCase()}</Text></View>
        )}
        <View style={styles.body}>
          <View style={styles.head}><Badge status={report.status as BadgeStatus} /><Text style={styles.when}>{ago(report.created_at)}</Text></View>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          {report.breed ? <Text style={styles.sub} numberOfLines={1}>{report.breed}</Text> : null}
          {report.location_label ? <Text style={styles.loc} numberOfLines={1}>{report.location_label}</Text> : null}
        </View>
      </View>
      {matchCount > 0 && report.status === "lost" ? (
        <Pressable accessibilityRole="button" accessibilityLabel="View matches" onPress={onMatches} style={styles.match}>
          <Text style={styles.matchT}>{matchCount} {matchCount === 1 ? "match" : "matches"} ›</Text>
        </Pressable>
      ) : null}
      {report.status === "reunited" ? (
        <View style={styles.closed}><Text style={styles.closedT}>Case closed — thanks for updating it.</Text></View>
      ) : onMarkReunited ? (
        <View style={styles.actions}>
          {onEdit ? <Pressable accessibilityRole="button" onPress={onEdit} style={[styles.action, { flex: 1 }]}><Text style={styles.actionT}>Edit report</Text></Pressable> : null}
          <Pressable accessibilityRole="button" onPress={onMarkReunited} style={[styles.action, styles.reunite, { flex: 1 }]}><Text style={[styles.actionT, { color: C.white }]}>Mark reunited</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, gap: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  row: { flexDirection: "row", gap: 12 },
  photo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: C.surface },
  fallback: { alignItems: "center", justifyContent: "center" },
  fallbackT: { fontFamily: font.headBold, fontSize: 22, color: C.slate500 },
  body: { flex: 1, gap: 3, justifyContent: "center" },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  when: { fontFamily: font.bodySemi, fontSize: 12, color: C.slate500 },
  name: { fontFamily: font.head, fontSize: 17, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  loc: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
  match: { alignSelf: "flex-start", minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: C.okTint, borderWidth: 1, borderColor: C.ok },
  matchT: { fontFamily: font.bodyBold, fontSize: 12, color: C.ink },
  closed: { padding: 10, borderRadius: radius.md, backgroundColor: C.okTint },
  closedT: { fontFamily: font.bodySemi, fontSize: 13, color: C.ok },
  actions: { flexDirection: "row", gap: 8 },
  reunite: { backgroundColor: C.ok, borderColor: C.ok },
  action: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2 },
  actionT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
});
