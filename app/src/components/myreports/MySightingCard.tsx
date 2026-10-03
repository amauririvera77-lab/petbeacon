import { ChevronRight, Info } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReportNearby } from "../../lib/database.types";
import { breedLabel } from "../../lib/breeds";
import { shortAddress } from "../../lib/address";
import { activityAt } from "../../lib/activity";
import { elapsedShort } from "../../lib/time";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { ReportRow } from "./ReportRow";
import { RowMenuButton } from "./RowMenuButton";

const SPECIES_WORD: Record<string, string> = { dog: "dog", cat: "cat", other: "pet" };

// Un avistamiento propio (evaluación UX): misma cabecera que un Lost (ReportRow: ubicación en vez de distancia, sin "Your report"). TODA
// la tarjeta abre el detalle (sin chevron); "Edit" vive en el botón "⋯" de la esquina, igual que en los reportes Lost. Queda un solo botón
// secundario, "Still there", bajo el principal "Mark as resolved". Sin raza, un aviso tocable (con su propia flecha) invita a completarla.
export function MySightingCard({ report, onOpen, onEdit, onStillThere, onResolve }: {
  report: ReportNearby; onOpen: () => void; onEdit: () => void; onStillThere: () => void; onResolve: () => void;
}) {
  const hasPhoto = !!report.photo_url;
  const breed = breedLabel(report.breed, report.breed_id);
  const hasBreed = !!breed;
  const word = SPECIES_WORD[report.species] ?? "pet";
  // Prioriza lo que más ayuda a reconocer al animal: sin foto es lo primero que falta (una raza sin foto sigue siendo difícil de identificar).
  const notice = !hasPhoto ? `Add a photo to help owners recognize this ${word}` : !hasBreed ? `Add breed or details to help owners recognize this ${word}` : null;
  const openMenu = () => Alert.alert("Sighting", undefined, [
    { text: "Edit", onPress: onEdit },
    { text: "Cancel", style: "cancel" },
  ]);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Sighting, open report" onPress={onOpen} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
      <ReportRow photoUrl={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} species={report.species}
        title={breed || (report.species === "cat" ? "Cat" : report.species === "dog" ? "Dog" : "Pet")} badge="sighted"
        timeText={`Spotted ${elapsedShort(activityAt(report))} ago`} locationText={shortAddress(report.location_label) ?? "Location not shared"} reserveMenuSpace />
      {notice ? (
        <Pressable accessibilityRole="button" onPress={(e) => { e.stopPropagation(); onEdit(); }} style={({ pressed }) => [styles.notice, pressed && { backgroundColor: Theme.brand.tint }]}>
          <Info size={14} color={Theme.text.secondary} />
          <Text style={styles.noticeT}>{notice}</Text>
          <View style={styles.noticeLink}>
            <Text style={styles.noticeLinkT}>Add details</Text>
            <ChevronRight size={14} color={Theme.text.primary} />
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
  card: { padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card },
  notice: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, padding: 10, borderRadius: radius.md, backgroundColor: Theme.surface.page },
  noticeT: { flex: 1, ...typography.caption12, color: Theme.text.secondary },
  noticeLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  noticeLinkT: { ...typography.label14, color: Theme.text.primary },
  actions: { gap: 8, marginTop: 12 },
  primary: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: Theme.brand.primary },
  primaryT: { ...typography.button16, color: Theme.text.onAccent },
  sec: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card },
  secT: { ...typography.button14, color: Theme.text.primary },
});
