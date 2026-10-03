import { ChevronRight, Dog, Cat, Share2, Sparkles, Users } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { MyReport } from "../hooks/useMyReports";
import { shortAddress } from "../lib/address";
import type { MyMatch } from "../lib/database.types";
import { pickPending } from "../lib/matchPick";
import { elapsedShort } from "../lib/time";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";
import { Badge } from "./Badge";
import { FocusImage } from "./FocusImage";
import { MatchBanner } from "./MatchBanner";
import { ReportRow } from "./myreports/ReportRow";
import { RowMenuButton } from "./myreports/RowMenuButton";

// Estado del propio reporte Lost (fase 2.1): foto y nombre, cuánto lleva perdida, vecinos alertados, avistamientos cercanos,
// acceso al detalle y —integrada, sin banner aparte— la coincidencia pendiente.
// `manage` (My Reports, evaluación UX): la MISMA tarjeta pero TODA ella abre el detalle (sin chevron); "Edit report" vive en el botón
// "⋯" de la esquina, y solo queda un botón secundario, "Mark as reunited". Sin `manage` es la tarjeta de estado de Home (sin cambios).
export function MyReportStatusCard({ report, matches, width, manage, onOpen, onViewSighting, onDismiss, onViewAll, onShare }: {
  report: MyReport; matches: MyMatch[]; width?: number; manage?: { onEdit: () => void; onMarkReunited: () => void };
  onOpen: () => void; onViewSighting: (m: MyMatch) => void; onDismiss: (m: MyMatch) => void; onViewAll: () => void; onShare: () => void;
}) {
  const title = report.name?.trim() || `Unknown ${report.species}`;
  const Fallback = report.species === "cat" ? Cat : Dog;
  const pending = pickPending(matches); // la más fuerte sin descartar (strong antes que possible; a igual fuerza, la más reciente)
  const openCount = matches.filter((m) => !m.dismissed).length; // solo las NO descartadas
  const alerted = report.alerted_count; // null/undefined → se OCULTA (no se muestra un número falso)
  const openMenu = () => manage && Alert.alert(title, undefined, [
    { text: "Edit report", onPress: manage.onEdit },
    { text: "Cancel", style: "cancel" },
  ]);

  return (
    <Pressable
      disabled={!manage}
      accessibilityRole={manage ? "button" : undefined}
      accessibilityLabel={manage ? `${title}, open report` : undefined}
      onPress={manage ? onOpen : undefined}
      style={({ pressed }) => [styles.card, width ? { width } : null, manage && pressed && { opacity: 0.95 }]}
    >
      {manage ? (
        <ReportRow photoUrl={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} species={report.species}
          title={title} badge="lost" timeText={`Missing for ${elapsedShort(report.created_at)}`}
          locationText={shortAddress(report.location_label) ?? "Location not shared"} reserveMenuSpace />
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={`${title}, open report`} onPress={onOpen} style={styles.head}>
          <View style={styles.photo}>
            {report.photo_url ? (
              <FocusImage uri={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} style={StyleSheet.absoluteFill} />
            ) : <Fallback size={26} color={Theme.text.muted} />}
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{title}</Text>
              <Badge status="lost" />
            </View>
            <Text style={styles.missing}>Missing for {elapsedShort(report.created_at)}</Text>
          </View>
          <ChevronRight size={18} color={Theme.text.muted} />
        </Pressable>
      )}

      <View style={styles.stats}>
        {alerted != null && alerted > 0 ? (
          <View style={styles.stat}>
            <Users size={14} color={Theme.text.secondary} />
            <Text style={styles.statT}>{`${alerted} ${alerted === 1 ? "neighbor" : "neighbors"} alerted`}</Text>
          </View>
        ) : null}
        <View style={styles.stat}>
          <Sparkles size={14} color={Theme.text.secondary} />
          <Text style={styles.statT}>{openCount === 0 ? "No matches yet" : `${openCount} ${openCount === 1 ? "match" : "matches"}`}</Text>
        </View>
      </View>
      {alerted === 0 && !manage ? (
        // Cero vecinos alertados (dato real): en vez de un vacío, una acción para ampliar el alcance con la hoja de compartir nativa.
        <Pressable accessibilityRole="button" onPress={onShare} style={styles.share}>
          <Share2 size={16} color={Theme.text.primary} />
          <Text style={styles.shareT}>Share your alert to reach more neighbors</Text>
        </Pressable>
      ) : null}

      {manage ? (
        <View style={styles.manage}>
          <Pressable accessibilityRole="button" onPress={(e) => { e.stopPropagation(); openCount > 0 ? onViewAll() : onShare(); }} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}>
            {openCount > 0 ? <Sparkles size={16} color={Theme.text.onAccent} /> : <Share2 size={16} color={Theme.text.onAccent} />}
            <Text style={styles.primaryT}>{openCount > 0 ? "Review matches" : "Share alert"}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={(e) => { e.stopPropagation(); manage.onMarkReunited(); }} style={styles.sec}><Text style={styles.secT}>Mark as reunited</Text></Pressable>
        </View>
      ) : null}

      {pending && !manage ? (
        <View style={{ marginTop: 8 }}>
          <MatchBanner match={pending} onViewSighting={() => onViewSighting(pending)} onDismiss={() => onDismiss(pending)} />
        </View>
      ) : null}
      {!manage && (matches.length > 1 || (matches.length === 1 && !pending)) ? (
        <Pressable accessibilityRole="button" onPress={onViewAll} style={styles.all}>
          <Text style={styles.allT}>View all matches ({matches.length})</Text>
        </Pressable>
      ) : null}

      {manage ? <RowMenuButton onPress={openMenu} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  photo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: Theme.surface.page, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  name: { flexShrink: 1, ...typography.heading16, color: Theme.text.primary },
  missing: { ...typography.label13, color: Theme.text.secondary },
  stats: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 4, marginTop: 8 },
  stat: { flexDirection: "row", alignItems: "center", gap: 6 },
  statT: { ...typography.label13, color: Theme.text.secondary },
  share: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", marginTop: 4, paddingHorizontal: 12, borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong },
  shareT: { ...typography.button14, color: Theme.text.primary },
  manage: { gap: 8, marginTop: 12 },
  primary: { minHeight: 48, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: Theme.brand.primary },
  primaryT: { ...typography.button16, color: Theme.text.onAccent },
  sec: { minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card },
  secT: { ...typography.button14, color: Theme.text.primary },
  all: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start", marginTop: 0 },
  allT: { ...typography.label14, color: Theme.text.secondary, textDecorationLine: "underline" },
});
