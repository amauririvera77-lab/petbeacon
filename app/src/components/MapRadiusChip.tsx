import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, font, radius } from "../theme/tokens";

const OPTIONS = [1, 5, 10]; // mismas opciones que el radio de la hoja de filtros (fase 4.3)

// Chip "5 mi ⌄" del mapa (CLAUDE.md §5.4). Cambia el radio de VISUALIZACIÓN (el mismo de la hoja de filtros, no el de alertas del perfil)
// y vuelve a consultar reports_nearby/resources_nearby con él.
export function MapRadiusChip({ value, onChange }: { value: number; onChange: (mi: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Search radius, ${value} miles`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={styles.chip}
      >
        <Text style={styles.chipT}>{value} mi</Text>
        <ChevronDown size={16} color={C.ink} />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          {OPTIONS.map((mi) => (
            <Pressable key={mi} accessibilityRole="menuitem" onPress={() => { onChange(mi); setOpen(false); }} style={styles.item}>
              <Text style={[styles.itemT, mi === value && { fontFamily: font.bodyBold }]}>{mi} mi</Text>
              {mi === value ? <Check size={16} color={C.ink} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 12, left: 12, zIndex: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill,
    backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  chipT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
  menu: {
    marginTop: 6, borderRadius: radius.md, backgroundColor: C.white, overflow: "hidden", minWidth: 110,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  item: { minHeight: 44, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemT: { fontFamily: font.body, fontSize: 14, color: C.ink },
});
