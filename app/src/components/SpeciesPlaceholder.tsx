import { Cat, Dog, PawPrint } from "lucide-react-native";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import type { Species } from "../lib/database.types";
import { C, radius } from "../theme/tokens";

// Silueta por especie cuando un reporte no tiene foto (fase 3.3): nunca un hueco vacío ni una imagen rota.
export function SpeciesPlaceholder({ species, size = 64, style }: { species: Species; size?: number; style?: StyleProp<ViewStyle> }) {
  const Icon = species === "cat" ? Cat : species === "dog" ? Dog : PawPrint;
  return (
    <View style={[styles.box, { width: size, height: size }, style]} accessibilityLabel={`${species} placeholder`}>
      <Icon size={size * 0.5} color={C.slate500} />
    </View>
  );
}
const styles = StyleSheet.create({ box: { borderRadius: radius.md, backgroundColor: C.surface, alignItems: "center", justifyContent: "center", overflow: "hidden" } });
