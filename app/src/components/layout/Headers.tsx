import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../AppText";
import { Theme } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Barra superior del onboarding: 56 px, "Skip" (botón fantasma pequeño) a la derecha. Sin `onSkip` queda el espacio vacío.
export function OnboardingHeader({ onSkip }: { onSkip?: () => void }) {
  return (
    <View style={styles.onb}>
      {onSkip ? (
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}><AppText style={styles.skipT}>Skip</AppText></Pressable>
      ) : null}
    </View>
  );
}

// Encabezado de los flujos de reporte: Back · título centrado · "n/3", y 3 barras de progreso (5 px) debajo.
export function FlowHeader({ title, step, total = 3, accent, onBack, showBars = true, showRow = true, showCount = true }: {
  title: string; step: number; total?: number; accent: string; onBack: () => void; showBars?: boolean; showRow?: boolean; showCount?: boolean;
}) {
  if (!showRow) return null;
  return (
    <View>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}><ChevronLeft size={22} color={Theme.text.primary} /></Pressable>
        <AppText style={styles.title} accessibilityRole="header">{title}</AppText>
        {showCount ? <AppText style={styles.count}>{Math.min(step, total)}/{total}</AppText> : <View style={{ minWidth: 44 }} />}
      </View>
      {showBars ? (
        <View style={styles.bars}>
          {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.bar, { backgroundColor: step >= i + 1 ? accent : Theme.border.default }]} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  onb: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", paddingHorizontal: 16 },
  // Botón fantasma "sm" del sistema (13 px, relleno lateral 18); mínimo 44 px de alto para el toque.
  skip: { minHeight: 44, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  skipT: { ...typography.label13, color: Theme.text.muted },
  row: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 4, paddingRight: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  title: { ...typography.heading16, color: Theme.text.primary },
  count: { minWidth: 44, textAlign: "right", paddingRight: 8, ...typography.label13, color: Theme.text.muted },
  bars: { flexDirection: "row", gap: 8, paddingHorizontal: 24, paddingBottom: 16 },
  bar: { flex: 1, height: 5, borderRadius: 999 },
});
