import { Cat, CircleHelp, Dog, HeartPulse, Smile, TriangleAlert, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Species } from "../../lib/database.types";
import { C, font, radius } from "../../theme/tokens";

// Tipo: 3 botones grandes con el ícono ENCIMA (prototipo). Seleccionado: borde ink 1.5, fondo #EEF2F6, texto ink.
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
            style={[styles.type, { borderColor: on ? C.ink : C.border, backgroundColor: on ? C.selectBg : C.white }]}>
            <Icon size={22} color={on ? C.ink : C.slate500} />
            <Text style={[styles.typeT, { color: on ? C.ink : C.slate500 }]}>{label}</Text>
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
            style={[styles.cond, { borderColor: on ? C.warn : C.border, backgroundColor: on ? C.warnTint : C.white }]}>
            <Icon size={20} color={C.ink} />
            <Text style={styles.condT}>{label}</Text>
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
  typeT: { fontFamily: font.bodyBold, fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cond: { flexBasis: "47%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 16, borderRadius: radius.md, borderWidth: 1.5 },
  condT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
});
