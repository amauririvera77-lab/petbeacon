import { Eye, Siren } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Chips de estado (fase 4.3 / C.1): "Lost" y "Sighted", multi-selección, ambos activos por defecto. Sin números.
// Activo: fondo con el tint del estado, borde de 2 px del color del estado, ícono del color del estado y texto en negrita.
// Inactivo: fondo blanco, borde neutro de 1 px, ícono y texto atenuados y sin negrita. Además del color, el estado se distingue por
// el GROSOR del borde y el PESO de la letra, así que se lee también sin ver colores. `accessibilityState.selected` lo anuncia.
export function StatusChips({ lost, sighted, onToggle }: { lost: boolean; sighted: boolean; onToggle: (k: "lost" | "sighted") => void }) {
  const items = [
    ["lost", "Lost", Siren, lost, C.sos, C.sosTint, C.sosDark],
    ["sighted", "Sighted", Eye, sighted, C.warn, C.warnTint, C.warn],
  ] as const;
  return (
    <View style={styles.row}>
      {items.map(([k, label, Icon, on, border, tint, icon]) => (
        <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${label} reports`} accessibilityHint={on ? "Shown. Double tap to hide." : "Hidden. Double tap to show."}
          onPress={() => onToggle(k)} style={[styles.chip, on ? { borderWidth: 2, borderColor: border, backgroundColor: tint } : styles.off]}>
          <Icon size={16} color={on ? icon : C.slate500} />
          <Text style={[styles.t, on ? { fontFamily: font.bodyBold, color: C.ink } : { fontFamily: font.bodyRegular, color: C.slate500 }]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  chip: { minHeight: MIN_HIT - 4, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: radius.pill },
  off: { borderWidth: 1, borderColor: C.border2, backgroundColor: C.white },
  t: { fontSize: 13 },
});
