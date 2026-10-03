import { List, Map as MapIcon } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Theme, MIN_HIT } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

// Segmented control List | Map compacto (fase 4.2): 32 px de alto mínimo (antes 40 a todo el ancho; minHeight para que crezca con el texto grande) y estado activo ligero (segmento blanco
// sobre pista gris, sin relleno negro). Recupera espacio vertical para el contenido. El toque conserva ≥44 px con `hitSlop`.
export function CompactSegmented({ value, onChange }: { value: "list" | "map"; onChange: (v: "list" | "map") => void }) {
  const items = [["list", "List", List], ["map", "Map", MapIcon]] as const;
  return (
    <View style={styles.track} accessibilityRole="tablist">
      {items.map(([v, label, Icon]) => {
        const on = value === v;
        return (
          <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: on }} hitSlop={{ top: (MIN_HIT - 32) / 2, bottom: (MIN_HIT - 32) / 2 }}
            onPress={() => onChange(v)} style={[styles.seg, on && styles.segOn]}>
            <Icon size={14} color={on ? Theme.brand.primary : Theme.text.muted} />
            <AppText role="control" style={[styles.t, { color: on ? Theme.brand.primary : Theme.text.muted }]}>{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", minHeight: 36, padding: 2, borderRadius: 10, backgroundColor: Theme.border.default },
  seg: { minWidth: 58, minHeight: 32, paddingHorizontal: 8, borderRadius: 8, flexDirection: "row", gap: 4, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: Theme.surface.card, ...elevation[1] },
  t: typography.button14,
});
