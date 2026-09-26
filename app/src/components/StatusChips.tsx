import { Eye, Siren } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Chips de estado (fase 4.3): "Lost" y "Sighted" con ÍCONO + TEXTO (no solo color), multi-selección, ambos activos por defecto.
// `sightedDot`: con un reporte Lost activo se destaca Sighted con un punto de contador (coincidencias pendientes) sin preseleccionarlo:
// preseleccionar solo Sighted ocultaría los Lost.
export function StatusChips({ lost, sighted, onToggle, sightedDot }: {
  lost: boolean; sighted: boolean; onToggle: (k: "lost" | "sighted") => void; sightedDot?: number;
}) {
  const items = [["lost", "Lost", Siren, lost, C.sosDark], ["sighted", "Sighted", Eye, sighted, C.warn]] as const;
  return (
    <View style={styles.row}>
      {items.map(([k, label, Icon, on, color]) => (
        <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${label} reports${k === "sighted" && sightedDot ? `, ${sightedDot} matches` : ""}`}
          onPress={() => onToggle(k)} style={[styles.chip, on && styles.chipOn]}>
          <Icon size={16} color={on ? color : C.slate500} />
          <Text style={[styles.t, { color: on ? C.ink : C.slate500 }]}>{label}</Text>
          {k === "sighted" && sightedDot ? <View style={styles.dot}><Text style={styles.dotT}>{sightedDot > 9 ? "9+" : sightedDot}</Text></View> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { minHeight: MIN_HIT - 4, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  chipOn: { borderColor: C.ink, backgroundColor: C.selectBg },
  t: { fontFamily: font.bodyBold, fontSize: 13 },
  // Contador neutro (ink): el rojo queda reservado a Lost y al badge de notificaciones.
  dot: { minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  dotT: { fontFamily: font.bodyBold, fontSize: 10, color: C.white },
});
