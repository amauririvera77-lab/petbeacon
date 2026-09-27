import { MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { C, MIN_HIT } from "../../theme/tokens";

// Botón "⋯" en la esquina superior derecha de una tarjeta de My Reports (evaluación UX, punto 3): la tarjeta entera abre el detalle;
// este es el único otro punto de toque, con un área de al menos 44×44 pt aunque el ícono sea más pequeño. Va como hermano del Pressable
// de la tarjeta (no anidado en otro control), posicionado encima con `position: "absolute"`.
export function RowMenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="More options"
      onPress={(e) => { e.stopPropagation(); onPress(); }}
      hitSlop={6}
      style={styles.btn}
    >
      <MoreHorizontal size={20} color={C.slate500} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { position: "absolute", top: 4, right: 4, width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", zIndex: 1 },
});
