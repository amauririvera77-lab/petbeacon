import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReportStatus } from "../lib/database.types";
import { C, font, radius } from "../theme/tokens";

export type MapFilterState = Record<ReportStatus, boolean>;
export const ALL_FILTERS: MapFilterState = { lost: true, sighted: true, reunited: true };

const ITEMS: { key: ReportStatus; label: string; color: string }[] = [
  { key: "lost", label: "Lost", color: C.sos },
  { key: "sighted", label: "Sighted", color: C.warn },
  { key: "reunited", label: "Reunited", color: C.ok },
];

// Filtros del mapa (prototipo): píldoras de 40 px con un punto. Activa: relleno del color del estado, texto blanco y punto blanco;
// inactiva: fondo #E2E8F0, texto slate500 y punto border2. Solo filtran los pines del mapa.
export function MapFilters({ value, onChange }: { value: MapFilterState; onChange: (v: MapFilterState) => void }) {
  return (
    <View style={styles.bar}>
      {ITEMS.map(({ key, label, color }) => {
        const on = value[key];
        return (
          <Pressable key={key} accessibilityRole="button" accessibilityLabel={`${label} pins`} accessibilityState={{ selected: on }}
            onPress={() => onChange({ ...value, [key]: !on })}
            style={[styles.pill, { backgroundColor: on ? color : C.border }]}>
            <View style={[styles.dot, { backgroundColor: on ? C.white : C.border2 }]} />
            <Text style={[styles.t, { color: on ? C.white : C.slate500 }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  pill: { height: 40, paddingHorizontal: 16, borderRadius: radius.pill, flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  t: { fontFamily: font.bodyBold, fontSize: 13 },
});
