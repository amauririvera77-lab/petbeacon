import { Check } from "lucide-react-native";
import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { C, font } from "../../theme/tokens";

// Bloque de éxito (prototipo): círculo con ícono ARRIBA → título → texto de apoyo → botones, todo centrado.
// Círculo de 80 (#E2E8F0) con check negro de 40; título de 28; relleno superior de 64.
export function SuccessBlock({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}><Check size={40} color={C.teal} /></View>
      <Text style={styles.h1} accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

export const successText = StyleSheet.create({
  p: { fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22.5, color: C.slate600, textAlign: "center" },
  strong: { fontFamily: font.bodyBold, fontSize: 15, lineHeight: 22.5, color: C.ink, textAlign: "center" },
});

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 64, paddingHorizontal: 24, paddingBottom: 24 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  h1: { fontFamily: font.displayMedium, fontSize: 28, letterSpacing: -0.28, color: C.ink, marginBottom: 8, textAlign: "center" },
});
