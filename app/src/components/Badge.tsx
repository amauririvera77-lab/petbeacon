import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { C, font, radius } from "../theme/tokens";

export type BadgeStatus = "lost" | "sighted" | "reunited";

// Píldoras rellenas con el color del estado y texto blanco (prototipo: meta(status).color).
const VARIANTS: Record<BadgeStatus, { label: string; bg: string }> = {
  lost: { label: "Lost", bg: C.sos },
  sighted: { label: "Sighted", bg: C.warn },
  reunited: { label: "Reunited", bg: C.ok },
};

export function Badge({ status, style }: { status: BadgeStatus; style?: StyleProp<ViewStyle> }) {
  const v = VARIANTS[status];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      <Text style={styles.text}>{v.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  text: { fontFamily: font.bodyBold, fontSize: 12, color: C.white },
});
