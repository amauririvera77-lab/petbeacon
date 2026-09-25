import { ChevronRight, Dog, Cat, Eye, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MyReport } from "../hooks/useMyReports";
import type { MyMatch } from "../lib/database.types";
import { elapsedShort } from "../lib/time";
import { C, font, radius } from "../theme/tokens";
import { Badge } from "./Badge";
import { FocusImage } from "./FocusImage";
import { MatchBanner } from "./MatchBanner";

// Estado del propio reporte Lost (fase 2.1): foto y nombre, cuánto lleva perdida, vecinos alertados, avistamientos cercanos,
// acceso al detalle y —integrada, sin banner aparte— la coincidencia pendiente.
export function MyReportStatusCard({ report, matches, width, onOpen, onViewSighting, onDismiss, onViewAll }: {
  report: MyReport; matches: MyMatch[]; width?: number;
  onOpen: () => void; onViewSighting: (m: MyMatch) => void; onDismiss: (m: MyMatch) => void; onViewAll: () => void;
}) {
  const title = report.name?.trim() || `Unknown ${report.species}`;
  const Fallback = report.species === "cat" ? Cat : Dog;
  const pending = matches.find((m) => !m.dismissed); // la más reciente sin descartar
  const alerted = report.alerted_count; // null/undefined → se OCULTA (no se muestra un número falso)

  return (
    <View style={[styles.card, width ? { width } : null]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${title}, open report`} onPress={onOpen} style={styles.head}>
        <View style={styles.photo}>
          {report.photo_url ? (
            <FocusImage uri={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} zoom={(report.photo_zoom ?? 100) / 100} style={StyleSheet.absoluteFill} />
          ) : <Fallback size={26} color={C.slate500} />}
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{title}</Text>
            <Badge status="lost" />
          </View>
          <Text style={styles.missing}>Missing for {elapsedShort(report.created_at)}</Text>
        </View>
        <ChevronRight size={18} color={C.slate500} />
      </Pressable>

      <View style={styles.stats}>
        {alerted != null ? (
          <View style={styles.stat}>
            <Users size={14} color={C.slate700} />
            <Text style={styles.statT}>{alerted === 0 ? "No neighbors alerted yet" : `${alerted} ${alerted === 1 ? "neighbor" : "neighbors"} alerted`}</Text>
          </View>
        ) : null}
        <View style={styles.stat}>
          <Eye size={14} color={C.slate700} />
          <Text style={styles.statT}>{matches.length === 0 ? "No sightings nearby yet" : `${matches.length} ${matches.length === 1 ? "sighting" : "sightings"} nearby`}</Text>
        </View>
      </View>

      {pending ? (
        <View style={{ marginTop: 12 }}>
          <MatchBanner match={pending} onViewSighting={() => onViewSighting(pending)} onDismiss={() => onDismiss(pending)} />
        </View>
      ) : null}
      {matches.length > 1 || (matches.length === 1 && !pending) ? (
        <Pressable accessibilityRole="button" onPress={onViewAll} style={styles.all}>
          <Text style={styles.allT}>View all matches ({matches.length})</Text>
          <ChevronRight size={14} color={C.slate500} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  photo: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: C.surface, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  name: { flexShrink: 1, fontFamily: font.head, fontSize: 17, color: C.ink },
  missing: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate700 },
  stats: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 6, marginTop: 12 },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statT: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate700 },
  all: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 4 },
  allT: { fontFamily: font.bodyBold, fontSize: 13, color: C.slate700 },
});
