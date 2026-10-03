import { Cat, CircleHelp, Dog, HeartPulse, Smile, TriangleAlert, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../AppText";
import type { Species } from "../../lib/database.types";
import { Theme, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Tipo: 3 botones grandes con el ícono ENCIMA (prototipo). Seleccionado: borde brand.primary 1.5, fondo brand.tint, texto brand.primary.
const TYPES: { value: Species; label: string; Icon: LucideIcon }[] = [
  { value: "dog", label: "Dog", Icon: Dog }, { value: "cat", label: "Cat", Icon: Cat }, { value: "other", label: "Other", Icon: CircleHelp },
];

export function TypeButtons({ value, onChange }: { value: Species | null; onChange: (v: Species) => void }) {
  return (
    <View style={styles.typeRow} accessibilityRole="radiogroup">
      {TYPES.map(({ value: v, label, Icon }) => {
        const on = v === value;
        return (
          <Pressable key={v} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(v)}
            style={[styles.type, { borderColor: on ? Theme.brand.primary : Theme.border.default, backgroundColor: on ? Theme.brand.tint : Theme.surface.card }]}>
            <Icon size={22} color={on ? Theme.brand.primary : Theme.text.muted} />
            <AppText role="control" style={[styles.typeT, { color: on ? Theme.brand.primary : Theme.text.muted }]}>{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

// Condición (avistamiento): cuadrícula 2×2 con ícono a la izquierda. Seleccionado: borde y fondo `warn`.
export type Condition = "calm" | "scared" | "injured" | "unsure";
const CONDS: { value: Condition; label: string; Icon: LucideIcon }[] = [
  { value: "calm", label: "Calm", Icon: Smile }, { value: "scared", label: "Scared", Icon: TriangleAlert },
  { value: "injured", label: "Injured", Icon: HeartPulse }, { value: "unsure", label: "Not sure", Icon: CircleHelp },
];

export function ConditionGrid({ value, onChange }: { value: Condition | null; onChange: (v: Condition) => void }) {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {CONDS.map(({ value: v, label, Icon }) => {
        const on = v === value;
        return (
          <Pressable key={v} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(v)}
            style={[styles.cond, { borderColor: on ? Theme.status.sighted.bg : Theme.border.default, backgroundColor: on ? Theme.status.sighted.tint : Theme.surface.card }]}>
            <Icon size={20} color={Theme.text.primary} />
            <AppText role="control" style={styles.condT}>{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export const CONDITION_LABEL: Record<Condition, string> = { calm: "Calm", scared: "Scared", injured: "Injured", unsure: "Not sure" };

const styles = StyleSheet.create({
  typeRow: { flexDirection: "row", gap: 12 },
  type: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 16, borderRadius: radius.md, borderWidth: 1.5 },
  typeT: typography.button14,
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cond: { flexBasis: "47%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 16, borderRadius: radius.md, borderWidth: 1.5 },
  condT: { ...typography.button14, color: Theme.text.primary },
});
