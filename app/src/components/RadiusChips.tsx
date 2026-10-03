import { Pressable, StyleSheet, Text, View } from "react-native";
import { RADIUS_OPTIONS, type RadiusMi } from "../lib/radius";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Selector de radio con las opciones discretas de la escala única (1 / 3 / 5 / 10 mi). Lo usa Profile ("Alert radius").
export function RadiusChips({ value, onChange }: { value: number; onChange: (v: RadiusMi) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {RADIUS_OPTIONS.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o)} style={[styles.chip, on && styles.on]}>
            <Text style={[styles.t, on && { color: Theme.text.onAccent }]}>{o} mi</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, minHeight: MIN_HIT, borderRadius: radius.pill, borderWidth: 1.5, borderColor: Theme.border.strong, alignItems: "center", justifyContent: "center", backgroundColor: Theme.surface.card },
  on: { backgroundColor: Theme.brand.primary, borderColor: Theme.brand.primary },
  t: { ...typography.button14, color: Theme.text.primary },
});
