import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

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
              <Text style={[styles.t, on && { color: C.white }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: MIN_HIT, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1.5, borderColor: C.border2, alignItems: "center", justifyContent: "center", backgroundColor: C.white },
  on: { backgroundColor: C.ink, borderColor: C.ink },
  t: { fontFamily: font.bodySemi, fontSize: 14, color: C.ink },
});
