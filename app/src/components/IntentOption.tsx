import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Tarjeta de intención reutilizable ("I lost my pet" / "I saw a pet"): tarjeta NEUTRA (surface.card + borde) — el
// color de estado va SOLO en el círculo del ícono, nunca en el fondo de la tarjeta (colores de estado = indicar
// estados, no fondo de botones de acción, CLAUDE.md). La usan el FAB (ReportSheet, "What would you like to
// report?") y el Welcome de onboarding ("What brings you here today?") — mismos textos, mismos íconos.
export function IntentOption({ title, sub, Icon, color, onPress, style }: {
  title: string; sub: string; Icon: LucideIcon; color: string; onPress: () => void; style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && { backgroundColor: Theme.surface.page }, style]}>
      <View style={[styles.icon, { backgroundColor: color }]}><Icon size={24} color={Theme.text.onAccent} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.optT}>{title}</Text>
        <Text style={styles.optS}>{sub}</Text>
      </View>
      <ChevronRight size={20} color={Theme.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: { minHeight: 84, flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  optT: { ...typography.heading18, color: Theme.text.primary },
  optS: { ...typography.bodySm13, color: Theme.text.secondary },
});
