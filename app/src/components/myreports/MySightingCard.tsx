import { ChevronRight, Info } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReportNearby } from "../../lib/database.types";
import { shortAddress } from "../../lib/address";
import { activityAt } from "../../lib/activity";
import { elapsedShort } from "../../lib/time";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";
import { ReportRow } from "./ReportRow";
import { RowMenuButton } from "./RowMenuButton";

const SPECIES_WORD: Record<string, string> = { dog: "dog", cat: "cat", other: "pet" };

// Un avistamiento propio (evaluación UX): misma cabecera que un Lost (ReportRow: ubicación en vez de distancia, sin "Your report"). TODA
// la tarjeta abre el detalle (sin chevron); "Edit" vive en el botón "⋯" de la esquina, igual que en los reportes Lost. Queda un solo botón
// secundario, "Still there", bajo el principal "Mark as resolved". Sin raza, un aviso tocable (con su propia flecha) invita a completarla.
export function MySightingCard({ report, onOpen, onEdit, onStillThere, onResolve }: {
  report: ReportNearby; onOpen: () => void; onEdit: () => void; onStillThere: () => void; onResolve: () => void;
}) {
  const hasBreed = !!report.breed?.trim();
  const openMenu = () => Alert.alert("Sighting", undefined, [
    { text: "Edit", onPress: onEdit },
    { text: "Cancel", style: "cancel" },
  ]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Sighting, open report" onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
      <ReportRow photoUrl={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} zoom={report.photo_zoom} species={report.species}
        title={report.breed?.trim() || (report.species === "cat" ? "Cat" : report.species === "dog" ? "Dog" : "Pet")} badge="sighted"
        timeText={`Spotted ${elapsedShort(activityAt(report))} ago`} locationText={shortAddress(report.location_label) ?? "Location not shared"} reserveMenuSpace />
      {!hasBreed ? (
        <Pressable accessibilityRole="button" onPress={(e) => { e.stopPropagation(); onEdit(); }} style={({ pressed }) => [styles.notice, pressed && { backgroundColor: C.selectBg }]}>
          <Info size={14} color={C.slate700} />
          <Text style={styles.noticeT}>{`Add breed or details to help owners recognize this ${SPECIES_WORD[report.species] ?? "pet"}`}</Text>
          <View style={styles.noticeLink}>
            <Text style={styles.noticeLinkT}>Add details</Text>
            <ChevronRight size={14} color={C.ink} />
          </View>
        </Pressable>
      ) : null}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={(e) => { e.stopPropagation(); onResolve(); }} style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}>
          <Text style={styles.primaryT}>Mark as resolved</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={(e) => { e.stopPropagation(); onStillThere(); }} style={styles.sec}><Text style={styles.secT}>Still there</Text></Pressable>
      </View>
      <RowMenuButton onPress={openMenu} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: { padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  notice: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: radius.md, backgroundColor: C.surface },
  noticeT: { flex: 1, fontFamily: font.bodyRegular, fontSize: 12, lineHeight: 17, color: C.slate700 },
  noticeLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  noticeLinkT: { fontFamily: font.bodyBold, fontSize: 12, color: C.ink },
  actions: { gap: 8, marginTop: 12 },
  primary: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: C.ink },
  primaryT: { fontFamily: font.bodyBold, fontSize: 15, color: C.white },
  sec: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white },
  secT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
});
