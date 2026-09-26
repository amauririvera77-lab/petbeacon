import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, font } from "../../theme/tokens";

// Barra superior del onboarding: 56 px, "Skip" (botón fantasma pequeño) a la derecha. Sin `onSkip` queda el espacio vacío.
export function OnboardingHeader({ onSkip }: { onSkip?: () => void }) {
  return (
    <View style={styles.onb}>
      {onSkip ? (
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}><Text style={styles.skipT}>Skip</Text></Pressable>
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
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}><ChevronLeft size={22} color={C.ink} /></Pressable>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        {showCount ? <Text style={styles.count}>{Math.min(step, total)}/{total}</Text> : <View style={{ minWidth: 44 }} />}
      </View>
      {showBars ? (
        <View style={styles.bars}>
          {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.bar, { backgroundColor: step >= i + 1 ? accent : C.border }]} />)}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  onb: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", paddingHorizontal: 16 },
  // Botón fantasma "sm" del sistema (13 px, relleno lateral 18); mínimo 44 px de alto para el toque.
  skip: { minHeight: 44, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" },
  skipT: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate500 },
  row: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingLeft: 4, paddingRight: 8 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  title: { fontFamily: font.head, fontSize: 16, color: C.ink },
  count: { minWidth: 44, textAlign: "right", paddingRight: 8, fontFamily: font.bodyBold, fontSize: 13, color: C.slate500 },
  bars: { flexDirection: "row", gap: 8, paddingHorizontal: 24, paddingBottom: 16 },
  bar: { flex: 1, height: 5, borderRadius: 999 },
});
