import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SORT_LABEL, SortMode } from "../lib/sort";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

// Control visible encima del feed: "Most recent ▾" con las opciones "Most recent" y "Nearest".
export function SortControl({ value, onChange, count, radiusMi }: { value: SortMode; onChange: (m: SortMode) => void; count: number; radiusMi: number }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.count}>{count} {count === 1 ? "report" : "reports"} within {radiusMi} mi</Text>
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Sort by: ${SORT_LABEL[value]}`} accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={styles.btn}>
          <Text style={styles.btnT}>{SORT_LABEL[value]}</Text>
          <ChevronDown size={16} color={Theme.text.primary} />
        </Pressable>
        {open ? (
          <View style={styles.menu}>
            {(Object.keys(SORT_LABEL) as SortMode[]).map((m) => (
              <Pressable key={m} accessibilityRole="menuitem" onPress={() => { onChange(m); setOpen(false); }} style={styles.item}>
                <Text style={styles.itemT}>{SORT_LABEL[m]}</Text>
                {m === value ? <Check size={16} color={Theme.brand.primary} /> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 5 },
  count: { flexShrink: 1, ...typography.label13, color: Theme.text.muted },
  btn: { minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  btnT: { ...typography.button14, color: Theme.text.primary },
  menu: {
    position: "absolute", top: MIN_HIT, right: 0, minWidth: 150, borderRadius: radius.md, backgroundColor: Theme.surface.card, overflow: "hidden",
    ...elevation[2],
  },
  item: { minHeight: MIN_HIT, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemT: { ...typography.label14, color: Theme.text.primary },
});
