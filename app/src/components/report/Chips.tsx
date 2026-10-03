import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export function Chips<T extends string>({ label, options, value, onChange }: {
  label: string; options: readonly { value: T; label: string }[]; value: T | null; onChange: (v: T) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={o.value} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
              style={[styles.chip, on && styles.on]}>
              <Text style={[styles.t, on && { color: Theme.text.onAccent }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  label: { ...typography.label14, color: Theme.text.secondary },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: MIN_HIT, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1.5, borderColor: Theme.border.strong, alignItems: "center", justifyContent: "center", backgroundColor: Theme.surface.card },
  on: { backgroundColor: Theme.brand.primary, borderColor: Theme.brand.primary },
  t: { ...typography.button14, color: Theme.text.primary },
});
