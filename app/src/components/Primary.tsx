import { Pressable, StyleSheet, Text } from "react-native";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// CTA principal del onboarding y de pantallas neutras: brand.primary, 56px de alto.
export function Primary({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.b, { backgroundColor: disabled ? Theme.border.default : Theme.brand.primary }, pressed && { opacity: 0.85 }]}
    >
      <Text style={[styles.t, { color: disabled ? Theme.text.muted : Theme.text.onAccent }]}>{label}</Text>
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
  t: typography.button16,
  link: { minHeight: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 },
  linkT: { ...typography.label14, color: Theme.text.secondary, textAlign: "center" },
});
