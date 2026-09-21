import { Pressable, StyleSheet, Text } from "react-native";
import { C, font, radius } from "../theme/tokens";

// CTA principal del onboarding y de pantallas neutras: negro (C.ink), 56px de alto.
export function Primary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.b, { backgroundColor: disabled ? C.border : C.ink }, pressed && { opacity: 0.85 }]}
    >
      <Text style={[styles.t, { color: disabled ? C.slate500 : C.white }]}>{label}</Text>
    </Pressable>
  );
}
export function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={styles.link}>
      <Text style={styles.linkT}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  b: { height: 56, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  t: { fontFamily: font.bodyBold, fontSize: 16 },
  link: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  linkT: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700, textAlign: "center", lineHeight: 20 },
});
