import { StyleSheet, Text, View } from "react-native";
import { C, font, radius } from "../theme/tokens";

export type BadgeStatus = "lost" | "sighted" | "reunited";

const VARIANTS: Record<BadgeStatus, { label: string; bg: string; fg: string }> = {
  lost: { label: "Lost", bg: C.sosTint, fg: C.sosDark },
  sighted: { label: "Sighted", bg: C.warnTint, fg: C.warn },
  reunited: { label: "Reunited", bg: C.okTint, fg: C.ok },
};

export function Badge({ status }: { status: BadgeStatus }) {
  const v = VARIANTS[status];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.text, { color: v.fg }]}>{v.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  text: { fontFamily: font.bodyBold, fontSize: 12 },
});
