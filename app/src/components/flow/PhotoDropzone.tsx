import { Camera } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { choosePhotoSource, pickPhoto } from "../../lib/pickPhoto";
import { Theme } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Zona de foto del prototipo: UN solo objetivo táctil grande (232 px, borde punteado de 2 px). Al tocarlo se elige el
// origen (cámara o galería) en un menú; con foto puesta, tocar la zona permite cambiarla y "Remove photo" queda a la vista
// (control y libertad del usuario, reconocimiento antes que recuerdo).
export function PhotoDropzone({ uri, onChange }: { uri: string | null; onChange: (uri: string | null) => void }) {
  const open = () => choosePhotoSource(async (src) => { const u = await pickPhoto(src); if (u) onChange(u); });
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel={uri ? "Change photo" : "Add a photo"} onPress={open} style={styles.zone}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : (
          <View style={styles.empty}>
            <Camera size={32} color={Theme.text.muted} />
            <Text style={styles.tap}>Tap to add photo</Text>
            <Text style={styles.opt}>Optional</Text>
          </View>
        )}
      </Pressable>
      {uri ? (
        <Pressable accessibilityRole="button" onPress={() => onChange(null)} style={styles.remove}><Text style={styles.removeT}>Remove photo</Text></Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { height: 232, borderRadius: 16, borderWidth: 2, borderStyle: "dashed", borderColor: Theme.border.strong, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  empty: { alignItems: "center", gap: 8 },
  tap: { ...typography.label14, color: Theme.text.secondary },
  opt: { ...typography.caption12, color: Theme.text.muted },
  remove: { alignSelf: "flex-start", marginTop: 16, paddingVertical: 8, minHeight: 44, justifyContent: "center" },
  removeT: { ...typography.label14, color: Theme.danger.text },
});
