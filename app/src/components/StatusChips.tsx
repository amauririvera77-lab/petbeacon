import { Eye, Siren } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography, weightOff } from "../theme/typography";

// Chips de estado (fase 4.3 / C.1): "Lost" y "Sighted", multi-selección, ambos activos por defecto. Sin números.
// Activo: fondo con el tint del estado, borde de 2 px del color del estado, ícono del color del estado y texto en negrita.
// Inactivo: fondo blanco, borde neutro de 1 px, ícono y texto atenuados y sin negrita. Además del color, el estado se distingue por
// el GROSOR del borde y el PESO de la letra, así que se lee también sin ver colores. `accessibilityState.selected` lo anuncia.
export function StatusChips({ lost, sighted, onToggle }: { lost: boolean; sighted: boolean; onToggle: (k: "lost" | "sighted") => void }) {
  const items = [
    ["lost", "Lost", Siren, lost, Theme.status.lost.bg, Theme.status.lost.tint, Theme.status.lost.bgStrong],
    ["sighted", "Sighted", Eye, sighted, Theme.status.sighted.bg, Theme.status.sighted.tint, Theme.status.sighted.bg],
  ] as const;
  return (
    <View style={styles.row}>
      {items.map(([k, label, Icon, on, border, tint, icon]) => (
        <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${label} reports`} accessibilityHint={on ? "Shown. Double tap to hide." : "Hidden. Double tap to show."}
          onPress={() => onToggle(k)} style={[styles.chip, on ? { borderWidth: 2, borderColor: border, backgroundColor: tint } : styles.off]}>
          <Icon size={16} color={on ? icon : Theme.text.muted} />
          <Text style={[styles.t, on ? { color: Theme.text.primary } : [weightOff.button14, { color: Theme.text.muted }]]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  chip: { minHeight: MIN_HIT - 4, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: radius.pill },
  off: { borderWidth: 1, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card },
  t: typography.button14,
});
