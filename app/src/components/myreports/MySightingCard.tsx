import { Info } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReportNearby } from "../../lib/database.types";
import { shortAddress } from "../../lib/address";
import { activityAt } from "../../lib/activity";
import { elapsedShort } from "../../lib/time";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";
import { ReportRow } from "./ReportRow";

const SPECIES_WORD: Record<string, string> = { dog: "dog", cat: "cat", other: "pet" };

// Un avistamiento propio (evaluación UX): misma cabecera que un Lost (ReportRow: chevron, ubicación en vez de distancia, sin "Your report").
// Acción principal "Mark as resolved"; "Edit" y "Still there" quedan como secundarias EN UNA FILA DE DOS (nunca tres en línea, para que
// ningún botón se desborde con ningún tamaño de texto). Sin raza, un aviso discreto invita a completarla.
export function MySightingCard({ report, onOpen, onEdit, onStillThere, onResolve }: {
  report: ReportNearby; onOpen: () => void; onEdit: () => void; onStillThere: () => void; onResolve: () => void;
}) {
  const hasBreed = !!report.breed?.trim();
  return (
    <View style={styles.card}>
      <ReportRow photoUrl={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} zoom={report.photo_zoom} species={report.species}
        title={report.breed?.trim() || (report.species === "cat" ? "Cat" : report.species === "dog" ? "Dog" : "Pet")} badge="sighted"
        timeText={`Spotted ${elapsedShort(activityAt(report))} ago`} locationText={shortAddress(report.location_label) ?? "Location not shared"} onOpen={onOpen} />
      {!hasBreed ? (
        <Pressable accessibilityRole="button" onPress={onEdit} style={({ pressed }) => [styles.notice, pressed && { backgroundColor: C.selectBg }]}>
          <Info size={14} color={C.slate700} />
          <Text style={styles.noticeT}>{`Add breed or details to help owners recognize this ${SPECIES_WORD[report.species] ?? "pet"}`}</Text>
        </Pressable>
      ) : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onResolve} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}>
          <Text style={styles.primaryT}>Mark as resolved</Text>
        </Pressable>
        <View style={styles.secRow}>
          <Pressable accessibilityRole="button" onPress={onEdit} style={styles.sec}><Text style={styles.secT}>Edit</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onStillThere} style={styles.sec}><Text style={styles.secT}>Still there</Text></Pressable>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 10, padding: 10, borderRadius: radius.md, backgroundColor: C.surface },
  noticeT: { flex: 1, fontFamily: font.bodyRegular, fontSize: 12, lineHeight: 17, color: C.slate700 },
  actions: { gap: 8, marginTop: 12 },
  primary: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: C.ink },
  primaryT: { fontFamily: font.bodyBold, fontSize: 15, color: C.white },
  // Exactamente DOS botones secundarios, cada uno flex:1: nunca se desbordan, con cualquier tamaño de texto crecen en alto, no en ancho.
  secRow: { flexDirection: "row", gap: 8 },
  sec: { flex: 1, minHeight: MIN_HIT, paddingHorizontal: 8, paddingVertical: 8, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white },
  secT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink, textAlign: "center" },
});
