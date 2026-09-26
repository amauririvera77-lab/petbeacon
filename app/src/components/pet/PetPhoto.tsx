import { Camera } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { choosePhotoSource, pickPhoto } from "../../lib/pickPhoto";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

// Foto de la mascota (Pet profile 2.3): la acción principal es "Change photo" (cámara o galería); "Remove photo" es secundaria y pide confirmación.
export function PetPhoto({ uri, petName, onChange }: { uri: string | null; petName: string; onChange: (uri: string | null) => void }) {
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
      {uri ? <Image source={{ uri }} style={styles.preview} accessibilityLabel="Pet photo" /> : (
        <View style={styles.empty}><Camera size={36} color={C.slate500} /><Text style={styles.emptyT}>No photo yet</Text></View>
      )}
      <Pressable accessibilityRole="button" disabled={busy} onPress={change} style={({ pressed }) => [styles.change, pressed && { opacity: 0.85 }]}>
        <Camera size={18} color={C.ink} /><Text style={styles.changeT}>{uri ? "Change photo" : "Add photo"}</Text>
      </Pressable>
      {uri ? <Pressable accessibilityRole="button" onPress={remove} style={styles.remove}><Text style={styles.removeT}>Remove photo</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: C.surface },
  empty: { aspectRatio: 4 / 3, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: "dashed", borderColor: C.border2, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", gap: 6 },
  emptyT: { fontFamily: font.bodySemi, fontSize: 15, color: C.slate500 },
  change: { minHeight: 48, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white },
  changeT: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  remove: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  removeT: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate700, textDecorationLine: "underline" },
});
