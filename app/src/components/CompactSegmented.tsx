import { List, Map as MapIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font } from "../theme/tokens";

// Segmented control List | Map compacto (fase 4.2): 32 px de alto (antes 40 a todo el ancho) y estado activo ligero (segmento blanco
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
            <Icon size={14} color={on ? C.ink : C.slate500} />
            <Text style={[styles.t, { color: on ? C.ink : C.slate500 }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", height: 36, padding: 2, borderRadius: 10, backgroundColor: C.border },
  seg: { minWidth: 68, height: 32, paddingHorizontal: 10, borderRadius: 8, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  segOn: { backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  t: { fontFamily: font.bodyBold, fontSize: 13 },
});
