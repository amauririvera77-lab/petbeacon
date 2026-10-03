import { StyleSheet, Text, View } from "react-native";
import { Theme } from "../theme/tokens";
import { typography } from "../theme/typography";

// Título de pantalla unificado (consolidación tipográfica): antes había TRES tratamientos para lo que CLAUDE.md
// describía como un solo componente — TabScreen.tsx tenía su propio estilo (Outfit Bold 28) sin usar en ningún
// lado, ScreenTitle ya cubría las 3 pestañas principales pero con Title/24 en vez de Display/28, y cada pantalla
// secundaria copiaba su propio bloque "back + título". Ahora es un solo componente con dos variantes, patrón iOS:
// - "display" (Display/28) — las 3 pestañas principales: My Reports, Support, Profile.
// - "title" (Title/24, default) — pantallas secundarias y pasos de flujo.
// Convención de mayúsculas: Title Case para nombres de pestañas y pantallas ("My Reports", "Edit Profile",
// "Report Lost Pet"); sentence case para todo lo demás (botones, secciones, etiquetas).
export function ScreenTitle({ title, subtitle, variant = "title" }: { title: string; subtitle?: string; variant?: "display" | "title" }) {
  return (
    <View>
      <Text style={[variant === "display" ? typography.display28 : typography.title24, styles.h]} accessibilityRole="header">{title}</Text>
      {subtitle ? <Text style={styles.s}>{subtitle}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  h: { color: Theme.text.primary, marginBottom: 4 }, // fontFamily/fontSize/lineHeight/letterSpacing: typography.display28 o .title24
  s: { ...typography.body14, color: Theme.text.secondary },
});
