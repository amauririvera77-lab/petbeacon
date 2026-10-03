import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

export type CtaTone = "ink" | "lost" | "sighted";
const BG: Record<CtaTone, string> = { ink: Theme.brand.primary, lost: Theme.status.lost.bg, sighted: Theme.status.sighted.bg };

// CTA principal del prototipo: 56 px, radio 12, 16/700, ancho completo. Deshabilitado: fondo `border.default` y texto `text.muted`.
export function Cta({ label, onPress, disabled, tone = "ink", loading, icon }: {
  label: string; onPress: () => void; disabled?: boolean; tone?: CtaTone; loading?: boolean; icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.b, { backgroundColor: disabled ? Theme.border.default : BG[tone] }, pressed && { opacity: 0.9 }, loading && { opacity: 0.75 }]}
    >
      {loading ? <ActivityIndicator size="small" color={Theme.text.onAccent} /> : icon}
      <Text style={[styles.t, { color: disabled ? Theme.text.muted : Theme.text.onAccent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  b: { width: "100%", height: 56, borderRadius: radius.md, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  t: typography.button16,
});
