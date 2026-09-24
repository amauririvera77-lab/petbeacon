import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { C, font } from "../theme/tokens";
import { OnboardingHeader } from "./layout/Headers";
import { ScreenLayout } from "./layout/ScreenLayout";

// Pantallas del onboarding (prototipo): barra superior de 56 px con "Skip", contenido que mide lo que ocupa y el CTA justo debajo.
export function OnboardingScreen({ children, cta, onSkip }: { children: ReactNode; cta?: ReactNode; onSkip?: () => void }) {
  return <ScreenLayout header={<OnboardingHeader onSkip={onSkip} />} cta={cta}>{children}</ScreenLayout>;
}

// Bloque centrado de las pantallas de permisos (ubicación, notificaciones): círculo de 80 con ícono de 36 → título → texto.
export function PrimingBlock({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <View style={styles.priming}>
      <View style={styles.circle}>{icon}</View>
      <Text style={[ob.h1, { textAlign: "center", marginBottom: 8 }]} accessibilityRole="header">{title}</Text>
      <Text style={[ob.p, { textAlign: "center" }]}>{children}</Text>
    </View>
  );
}

// Tipografía del onboarding: h1 26/1.2 (Geist 600, -0.01em), texto de apoyo 15/1.5 en #475569.
export const ob = StyleSheet.create({
  h1: { fontFamily: font.displayMedium, fontSize: 26, lineHeight: 31.2, letterSpacing: -0.26, color: C.ink },
  p: { fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22.5, color: C.slate600 },
});

const styles = StyleSheet.create({
  priming: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24, paddingBottom: 24 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 32 },
});
