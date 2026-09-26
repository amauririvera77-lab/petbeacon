import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SORT_LABEL, SortMode } from "../lib/sort";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Control visible encima del feed: "Most recent ▾" con las opciones "Most recent" y "Nearest".
export function SortControl({ value, onChange, count, radiusMi }: { value: SortMode; onChange: (m: SortMode) => void; count: number; radiusMi: number }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.count}>{count} {count === 1 ? "report" : "reports"} within {radiusMi} mi</Text>
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Sort by: ${SORT_LABEL[value]}`} accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={styles.btn}>
          <Text style={styles.btnT}>{SORT_LABEL[value]}</Text>
          <ChevronDown size={16} color={C.ink} />
        </Pressable>
        {open ? (
          <View style={styles.menu}>
            {(Object.keys(SORT_LABEL) as SortMode[]).map((m) => (
              <Pressable key={m} accessibilityRole="menuitem" onPress={() => { onChange(m); setOpen(false); }} style={styles.item}>
                <Text style={[styles.itemT, m === value && { fontFamily: font.bodyBold }]}>{SORT_LABEL[m]}</Text>
                {m === value ? <Check size={16} color={C.ink} /> : null}
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
  count: { flexShrink: 1, fontFamily: font.bodySemi, fontSize: 13, color: C.slate500 },
  btn: { minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  btnT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
  menu: {
    position: "absolute", top: MIN_HIT, right: 0, minWidth: 150, borderRadius: radius.md, backgroundColor: C.white, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  item: { minHeight: MIN_HIT, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemT: { fontFamily: font.body, fontSize: 14, color: C.ink },
});
