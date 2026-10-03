import { Image, StyleSheet, Text, View } from "react-native";
import { Theme, font } from "../../theme/tokens";

// Foto del usuario o, si no hay, sus iniciales (círculo slate/200 del prototipo).
export function Avatar({ uri, name, size = 64 }: { uri: string | null; name: string; size?: number }) {
  const initials = name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
  return (
    <View style={[styles.box, { width: size, height: size, borderRadius: size / 2 }]} accessibilityLabel={uri ? "Profile photo" : `Initials ${initials || "none"}`}>
      {uri ? <Image source={{ uri }} style={{ width: size, height: size }} /> : <Text style={[styles.t, { fontSize: size * 0.36 }]}>{initials || "?"}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  box: { backgroundColor: Theme.border.default, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  t: { fontFamily: font.head, color: Theme.text.secondary },
});
