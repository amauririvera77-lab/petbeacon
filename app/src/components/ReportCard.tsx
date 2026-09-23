import { Pressable, StyleSheet, Text, View } from "react-native";
import { Badge, BadgeStatus } from "./Badge";
import { FocusImage } from "./FocusImage";
import { C, font, radius } from "../theme/tokens";
import type { ReportNearby } from "../lib/database.types";

const SPECIES_LABEL: Record<string, string> = { dog: "Dog", cat: "Cat", other: "Pet" };

export function ReportCard({ report, onPress }: { report: ReportNearby; onPress?: () => void }) {
  const title = report.name?.trim() || `Unknown ${SPECIES_LABEL[report.species].toLowerCase()}`;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {report.photo_url ? (
        <FocusImage uri={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} zoom={(report.photo_zoom ?? 100) / 100} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoFallback]}>
          <Text style={styles.photoFallbackT}>{title[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.row}>
          <Badge status={report.status as BadgeStatus} />
          <Text style={styles.distance}>{report.distance_mi.toFixed(1)} mi</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{title}</Text>
        {report.breed ? <Text style={styles.breed} numberOfLines={1}>{report.breed}</Text> : null}
        {report.location_label ? <Text style={styles.loc} numberOfLines={1}>{report.location_label}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  photo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: C.surface },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  photoFallbackT: { fontFamily: font.headBold, fontSize: 22, color: C.slate500 },
  body: { flex: 1, gap: 4, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  distance: { fontFamily: font.bodySemi, fontSize: 12, color: C.slate500 },
  name: { fontFamily: font.head, fontSize: 17, color: C.ink },
  breed: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  loc: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
});
