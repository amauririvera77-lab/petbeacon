import { X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { activeFilterChips } from "../lib/homeFilters";
import type { Prefs } from "../state/homePrefs";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Fila compacta bajo los chips (C.3): cada filtro activo de la hoja como chip removible ("Dogs only ×") y "Clear all". Solo existe si hay
// filtros distintos del valor por defecto: así se ve que la lista está filtrada sin abrir la hoja. El radio no aparece aquí.
export function ActiveFilters({ prefs, onChange, onClearAll }: { prefs: Prefs; onChange: (p: Partial<Prefs>) => void; onClearAll: () => void }) {
  const chips = activeFilterChips(prefs);
  if (chips.length === 0) return null;
  return (
    <View style={styles.row}>
      {chips.map((c) => (
        <Pressable key={c.key} accessibilityRole="button" accessibilityLabel={`Remove filter: ${c.label}`} onPress={() => onChange(c.clear)}
          hitSlop={{ top: 6, bottom: 6 }} style={styles.chip}>
          <Text style={styles.t}>{c.label}</Text>
          <X size={13} color={Theme.text.primary} />
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" onPress={onClearAll} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }} style={styles.clear}>
        <Text style={styles.clearT}>Clear all</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 10 },
  chip: { minHeight: 30, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: Theme.brand.tint, borderWidth: 1, borderColor: Theme.border.strong },
  t: { ...typography.button14, color: Theme.text.primary },
  clear: { minHeight: 30, justifyContent: "center", paddingHorizontal: 4 },
  clearT: { ...typography.button14, color: Theme.text.secondary, textDecorationLine: "underline" },
});
