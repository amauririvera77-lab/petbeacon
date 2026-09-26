import { SlidersHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Botón de filtros (fila de chips, a la izquierda del List/Map). El badge cuenta los filtros de la hoja distintos de su valor por
// defecto (especie, antigüedad, Show reunited); el radio NO cuenta.
export function FilterButton({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={count > 0 ? `Filters, ${count} active` : "Filters"} onPress={onPress} style={styles.btn}>
      <SlidersHorizontal size={20} color={C.ink} />
      {count > 0 ? <View style={styles.badge}><Text style={styles.badgeT}>{count}</Text></View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: MIN_HIT, height: MIN_HIT - 4, borderRadius: radius.md, borderWidth: 1, borderColor: C.border2, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.ink, borderWidth: 2, borderColor: C.white, alignItems: "center", justifyContent: "center" },
  badgeT: { fontFamily: font.bodyBold, fontSize: 10, color: C.white },
});
