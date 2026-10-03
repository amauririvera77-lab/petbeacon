import { Check } from "lucide-react-native";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "../AppText";
import { Theme } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Bloque de éxito (prototipo): círculo con ícono ARRIBA → título → texto de apoyo → botones, todo centrado.
// Círculo de 80 (border.default) con check brand.primary de 40; título Display/28; relleno superior de 64.
export function SuccessBlock({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}><Check size={40} color={Theme.brand.primary} /></View>
      <AppText role="title" style={styles.h1} accessibilityRole="header">{title}</AppText>
      {children}
    </View>
  );
}

export const successText = StyleSheet.create({
  p: { ...typography.bodyLg16, color: Theme.text.secondary, textAlign: "center" },
  strong: { ...typography.label14, color: Theme.text.primary, textAlign: "center" },
});

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 64, paddingHorizontal: 24, paddingBottom: 24 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.border.default, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  h1: { ...typography.display28, color: Theme.text.primary, marginBottom: 8, textAlign: "center" },
});
