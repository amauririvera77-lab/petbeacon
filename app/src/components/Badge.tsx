import { useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

export type BadgeStatus = "lost" | "sighted" | "reunited";

// Píldoras rellenas con el color del estado y texto blanco (prototipo: meta(status).color).
const VARIANTS: Record<BadgeStatus, { label: string; bg: string }> = {
  lost: { label: "Lost", bg: Theme.status.lost.bg },
  sighted: { label: "Sighted", bg: Theme.status.sighted.bg },
  reunited: { label: "Reunited", bg: Theme.status.reunited.bg },
};

const PAD_V = 4;
// Ajuste visual acordado: la píldora se baja ~5px respecto a apoyar su borde exacto sobre la línea base.
const NUDGE_DOWN = 5;

// sitOnBaseline: el BORDE INFERIOR de la píldora queda sobre la línea base del texto vecino (p. ej. el nombre de la mascota).
// Con `alignSelf: "baseline"` el texto de la píldora comparte esa línea y la píldora sobresale por debajo
// (padding inferior + descendente de su tipografía). Se mide el descendente real (onTextLayout) y se sube ese tramo.
export function Badge({ status, style, sitOnBaseline }: { status: BadgeStatus; style?: StyleProp<ViewStyle>; sitOnBaseline?: boolean }) {
  const v = VARIANTS[status];
  const [descender, setDescender] = useState(3.6); // valor inicial estimado para Manrope 12px; se reemplaza al medir
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, sitOnBaseline && { alignSelf: "baseline", transform: [{ translateY: -(PAD_V + descender) + NUDGE_DOWN }] }, style]}>
      <Text style={styles.text} onTextLayout={sitOnBaseline ? (e) => { const d = e.nativeEvent.lines[0]?.descender; if (d != null && Math.abs(d - descender) > 0.1) setDescender(d); } : undefined}>{v.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: PAD_V, borderRadius: radius.pill },
  text: { ...typography.badge12, color: Theme.text.onAccent },
});
