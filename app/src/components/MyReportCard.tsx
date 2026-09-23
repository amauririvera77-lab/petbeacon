import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { MyReport } from "../hooks/useMyReports";
import { C, MIN_HIT, font, radius } from "../theme/tokens";
import { Badge } from "./Badge";

function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function MyReportCard({ report, matchCount, onMarkReunited }: { report: MyReport; matchCount: number; onMarkReunited?: () => void }) {
  const title = report.name?.trim() || `Unknown ${report.species}`;
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {report.photo_url ? <Image source={{ uri: report.photo_url }} style={styles.photo} /> : (
          <View style={[styles.photo, styles.fallback]}><Text style={styles.fallbackT}>{title[0]?.toUpperCase()}</Text></View>
        )}
        <View style={styles.body}>
          <View style={styles.head}><Badge status={report.status} /><Text style={styles.when}>{ago(report.created_at)}</Text></View>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          {report.breed ? <Text style={styles.sub} numberOfLines={1}>{report.breed}</Text> : null}
          {report.location_label ? <Text style={styles.loc} numberOfLines={1}>{report.location_label}</Text> : null}
        </View>
      </View>
      {matchCount > 0 && report.status === "lost" ? (
        <View style={styles.match}><Text style={styles.matchT}>{matchCount} possible {matchCount === 1 ? "match" : "matches"}</Text></View>
      ) : null}
      {report.status === "reunited" ? (
        <View style={styles.closed}><Text style={styles.closedT}>Case closed — thanks for updating it.</Text></View>
      ) : onMarkReunited ? (
        <Pressable accessibilityRole="button" onPress={onMarkReunited} style={styles.action}><Text style={styles.actionT}>Mark reunited</Text></Pressable>
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
  match: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: C.warnTint },
  matchT: { fontFamily: font.bodyBold, fontSize: 12, color: C.warn },
  closed: { padding: 10, borderRadius: radius.md, backgroundColor: C.okTint },
  closedT: { fontFamily: font.bodySemi, fontSize: 13, color: C.ok },
  action: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2 },
  actionT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
});
