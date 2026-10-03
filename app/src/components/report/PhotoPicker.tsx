import * as ImagePicker from "expo-image-picker";
import { Camera, ImageIcon } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Foto opcional: cámara o galería. quality 0.7 mantiene el archivo liviano para subirlo a Storage.
export function PhotoPicker({ uri, onChange }: { uri: string | null; onChange: (uri: string | null) => void }) {
  const [busy, setBusy] = useState(false);

  const pick = async (source: "camera" | "library") => {
    setBusy(true);
    try {
      const perm = source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", `Allow ${source === "camera" ? "camera" : "photo"} access in Settings to add a photo, or skip this step.`);
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.7, allowsEditing: true, aspect: [4, 3] };
      const res = source === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (!res.canceled && res.assets[0]) onChange(res.assets[0].uri);
    } finally {
      setBusy(false);
    }
  };

  if (uri) {
    return (
      <View style={{ gap: 12 }}>
        <Image source={{ uri }} style={styles.preview} accessibilityLabel="Selected photo" />
        <Pressable accessibilityRole="button" onPress={() => onChange(null)} style={styles.remove}><Text style={styles.removeT}>Remove photo</Text></Pressable>
      </View>
    );
  }
  return (
    <View style={{ gap: 12 }}>
      <View style={styles.empty}><Camera size={36} color={Theme.text.muted} /><Text style={styles.emptyT}>Tap to add photo</Text><Text style={styles.emptyS}>Optional</Text></View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => pick("camera")} style={styles.btn}><Camera size={18} color={Theme.text.primary} /><Text style={styles.btnT}>Take photo</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => pick("library")} style={styles.btn}><ImageIcon size={18} color={Theme.text.primary} /><Text style={styles.btnT}>Choose photo</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.lg, backgroundColor: Theme.surface.page },
  remove: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  removeT: { ...typography.label14, color: Theme.danger.text },
  empty: { aspectRatio: 4 / 3, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: "dashed", borderColor: Theme.border.strong, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", gap: 4 },
  emptyT: { ...typography.heading16, color: Theme.text.primary },
  emptyS: { ...typography.bodySm13, color: Theme.text.muted },
  row: { flexDirection: "row", gap: 12 },
  btn: { flex: 1, minHeight: 48, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong },
  btnT: { ...typography.button14, color: Theme.text.primary },
});
