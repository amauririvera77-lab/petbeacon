import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../AppText";
import { choosePhotoSource, pickPhoto } from "../../lib/pickPhoto";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { Button } from "../Button";
import { FocusImage } from "../FocusImage";

// Foto de la mascota (Pet profile 2.3), en dos piezas: la imagen y sus acciones. Van separadas para que el bloque de estado (Lost/Reunited
// + acción de reporte) pueda ir ENTRE ambas, justo debajo de la foto (evaluación UX): imagen → estado → Change/Remove photo → resto del form.
export function PetPhotoImage({ uri, focusX, focusY }: { uri: string | null; focusX?: number | null; focusY?: number | null }) {
  return uri ? <FocusImage uri={uri} focusX={focusX} focusY={focusY} style={styles.preview} accessibilityLabel="Pet photo" /> : (
    <View style={styles.empty}><Camera size={36} color={Theme.text.muted} /><AppText style={styles.emptyT}>No photo yet</AppText></View>
  );
}

// La acción principal es "Change photo" (cámara o galería); "Remove photo" es secundaria y pide confirmación.
export function PetPhotoActions({ uri, petName, onChange }: { uri: string | null; petName: string; onChange: (uri: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const change = () => choosePhotoSource(async (source) => {
    setBusy(true);
    try { const u = await pickPhoto(source); if (u) onChange(u); } finally { setBusy(false); }
  });
  const remove = () => Alert.alert(
    `Remove ${petName.trim() || "this pet"}'s photo?`, "Photos are the best way for neighbors to recognize your pet.",
    [{ text: "Cancel", style: "cancel" }, { text: "Remove photo", style: "destructive", onPress: () => onChange(null) }],
  );
  return (
    <View style={{ gap: 8 }}>
      <Button variant="secondary" Icon={Camera} label={uri ? "Change photo" : "Add photo"} onPress={change} disabled={busy} />
      {uri ? <Pressable accessibilityRole="button" onPress={remove} style={styles.remove}><AppText style={styles.removeT}>Remove photo</AppText></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: Theme.surface.page },
  empty: { aspectRatio: 4 / 3, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: "dashed", borderColor: Theme.border.strong, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", gap: 6 },
  emptyT: { ...typography.heading16, color: Theme.text.muted },
  remove: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  removeT: { ...typography.label14, color: Theme.text.secondary, textDecorationLine: "underline" },
});
