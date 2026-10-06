import { Cat, CircleHelp, Dog, HeartPulse, Smile, TriangleAlert, type LucideIcon } from "lucide-react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { Species } from "../../lib/database.types";
import { Theme, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Tono del estado seleccionado de un selector del flujo de reporte. "brand" = el de siempre (borde brand.primary, fondo brand.tint, ícono y
// texto brand.primary). "sighted" / "lost" = EXACTAMENTE los tokens de los chips de estado de ese flujo (los mismos que ConditionGrid en
// "Report a Sighting"): borde `status.*.bg`, fondo `status.*.tint`, ícono y texto `text.primary`. Un único lugar para los tres, así no se desfasan.
export type OptionTone = "brand" | "sighted" | "lost";
const SELECTED: Record<OptionTone, { border: string; bg: string; fg: string }> = {
  brand: { border: Theme.brand.primary, bg: Theme.brand.tint, fg: Theme.brand.primary },
  sighted: { border: Theme.status.sighted.bg, bg: Theme.status.sighted.tint, fg: Theme.text.primary },
  lost: { border: Theme.status.lost.bg, bg: Theme.status.lost.tint, fg: Theme.text.primary },
};
// Color de acento de un tono: el borde de su estado seleccionado. Lo usan también los campos de texto del flujo (borde en foco, cursor,
// selección — TextField `tone`) para que todo lo "activo" de un flujo comparta un solo color.
export const toneAccent = (tone: OptionTone): string => SELECTED[tone].border;
// Cursor y selección de un TextInput con el acento del tono. iOS tiñe cursor, asas y resaltado con `selectionColor` (el resaltado ya lo
// aclara el sistema). Android pinta el resaltado con el color tal cual, encima del texto: ahí va al 25 % y el cursor/asas, opacos, aparte.
export const toneInputColors = (tone: OptionTone) => {
  const c = toneAccent(tone);
  return Platform.OS === "android" ? { selectionColor: `${c}40`, cursorColor: c, selectionHandleColor: c } : { selectionColor: c };
};

// Tipo: 3 botones grandes con el ícono ENCIMA (prototipo). Seleccionado: según `tone` (por defecto "brand"; ver SELECTED).
const TYPES: { value: Species; label: string; Icon: LucideIcon }[] = [
  { value: "dog", label: "Dog", Icon: Dog }, { value: "cat", label: "Cat", Icon: Cat }, { value: "other", label: "Other", Icon: CircleHelp },
];

export function TypeButtons({ value, onChange, tone = "brand" }: { value: Species | null; onChange: (v: Species) => void; tone?: OptionTone }) {
  const sel = SELECTED[tone];
  return (
    <View style={styles.typeRow} accessibilityRole="radiogroup">
      {TYPES.map(({ value: v, label, Icon }) => {
        const on = v === value;
        return (
          <Pressable key={v} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(v)}
            style={[styles.type, { borderColor: on ? sel.border : Theme.border.default, backgroundColor: on ? sel.bg : Theme.surface.card }]}>
            <Icon size={22} color={on ? sel.fg : Theme.text.muted} />
            <Text style={[styles.typeT, { color: on ? sel.fg : Theme.text.muted }]}>{label}</Text>
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
            style={[styles.cond, { borderColor: on ? SELECTED.sighted.border : Theme.border.default, backgroundColor: on ? SELECTED.sighted.bg : Theme.surface.card }]}>
            <Icon size={20} color={Theme.text.primary} />
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
  typeT: typography.button14,
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  cond: { flexBasis: "47%", flexGrow: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 16, borderRadius: radius.md, borderWidth: 1.5 },
  condT: { ...typography.button14, color: Theme.text.primary },
});
