import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme/tokens";
import { typography } from "../theme/typography";
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
      {/* alignSelf: "stretch" — el texto usa TODO el ancho disponible (como el bloque del prototipo) en vez de ajustarse a su contenido; */}
      {/* si no, iOS parte las líneas antes de tiempo (p. ej. después de "alerts") y el corte no coincide con el prototipo ("…and the map / for your area."). */}
      <Text style={[ob.h1, { textAlign: "center", marginBottom: 8, alignSelf: "stretch" }]} accessibilityRole="header">{title}</Text>
      <Text style={[ob.p, { textAlign: "center", alignSelf: "stretch" }]}>{children}</Text>
    </View>
  );
}

// Tipografía del onboarding: Title/24 para el título, Body-Lg/16 para el texto de apoyo, en text.secondary.
export const ob = StyleSheet.create({
  h1: { ...typography.title24, color: Theme.text.primary },
  p: { ...typography.bodyLg16, color: Theme.text.secondary },
});

const styles = StyleSheet.create({
  priming: { alignItems: "center", paddingTop: 40, paddingHorizontal: 24, paddingBottom: 24 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: Theme.border.default, alignItems: "center", justifyContent: "center", marginBottom: 32 },
});
