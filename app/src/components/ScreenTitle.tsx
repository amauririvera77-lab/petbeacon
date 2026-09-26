import { StyleSheet, Text, View } from "react-native";
import { C, font } from "../theme/tokens";

// Título de pantalla de las pestañas (My Reports, Support, Profile): UN solo estilo (Fase 6). Convención de mayúsculas: Title Case para los nombres de
// pestañas y de pantallas ("My Reports", "Edit Profile", "Report Lost Pet"); sentence case para todo lo demás (botones, secciones, etiquetas).
// El título de cada pestaña coincide con el nombre de su ícono en la barra inferior.
export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View>
      <Text style={styles.h} accessibilityRole="header">{title}</Text>
      {subtitle ? <Text style={styles.s}>{subtitle}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  h: { fontFamily: font.displayMedium, fontSize: 24, letterSpacing: -0.24, color: C.ink, marginBottom: 4 },
  s: { fontFamily: font.bodyRegular, fontSize: 14, color: C.slate700 },
});
