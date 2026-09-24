import { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { C, font, radius } from "../theme/tokens";

export type CtaTone = "ink" | "lost" | "sighted";
const BG: Record<CtaTone, string> = { ink: C.ink, lost: C.sos, sighted: C.warn };

// CTA principal del prototipo: 56 px, radio 12, 16/700, ancho completo. Deshabilitado: fondo `border` y texto `slate500`.
export function Cta({ label, onPress, disabled, tone = "ink", loading, icon }: {
  label: string; onPress: () => void; disabled?: boolean; tone?: CtaTone; loading?: boolean; icon?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.b, { backgroundColor: disabled ? C.border : BG[tone] }, pressed && { opacity: 0.9 }, loading && { opacity: 0.75 }]}
    >
      {loading ? <ActivityIndicator size="small" color={C.white} /> : icon}
      <Text style={[styles.t, { color: disabled ? C.slate500 : C.white }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  b: { width: "100%", height: 56, borderRadius: radius.md, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  t: { fontFamily: font.bodyBold, fontSize: 16 },
});
