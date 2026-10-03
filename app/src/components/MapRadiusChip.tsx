import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Theme, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

import { RADIUS_OPTIONS } from "../lib/radius";

const OPTIONS = RADIUS_OPTIONS; // la escala única de radios (1 / 3 / 5 / 10 mi), la misma de Profile y de la hoja de filtros

// Chip "5 mi ⌄" del mapa (CLAUDE.md §5.4). Cambia el radio de VISUALIZACIÓN (el mismo de la hoja de filtros, no el de alertas del perfil)
// y vuelve a consultar reports_nearby/resources_nearby con él.
export function MapRadiusChip({ value, onChange }: { value: number; onChange: (mi: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Showing within ${value} miles`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={styles.chip}
      >
        <AppText role="control" style={styles.chipT}>{value} mi</AppText>
        <ChevronDown size={16} color={Theme.text.primary} />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          {OPTIONS.map((mi) => (
            <Pressable key={mi} accessibilityRole="menuitem" onPress={() => { onChange(mi); setOpen(false); }} style={styles.item}>
              <AppText style={styles.itemT}>{mi} mi</AppText>
              {mi === value ? <Check size={16} color={Theme.brand.primary} /> : null}
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
    backgroundColor: Theme.surface.card, ...elevation[1],
  },
  chipT: { ...typography.button14, color: Theme.text.primary },
  menu: {
    marginTop: 6, borderRadius: radius.md, backgroundColor: Theme.surface.card, overflow: "hidden", minWidth: 110,
    ...elevation[2],
  },
  item: { minHeight: 44, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  itemT: { ...typography.label14, color: Theme.text.primary },
});
