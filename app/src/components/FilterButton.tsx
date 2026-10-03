import { SlidersHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Botón de filtros (fila de chips, a la izquierda del List/Map). El badge cuenta los filtros de la hoja distintos de su valor por
// defecto (especie, antigüedad, Show reunited); el radio NO cuenta.
export function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={count > 0 ? `Filters, ${count} active` : "Filters"} onPress={onPress} style={styles.btn}>
      <SlidersHorizontal size={20} color={Theme.text.primary} />
      {count > 0 ? <View style={styles.badge}><Text style={styles.badgeT}>{count}</Text></View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: MIN_HIT, height: MIN_HIT - 4, borderRadius: radius.md, borderWidth: 1, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: Theme.brand.primary, borderWidth: 2, borderColor: Theme.surface.card, alignItems: "center", justifyContent: "center" },
  badgeT: { ...typography.micro11, color: Theme.text.onAccent },
});
