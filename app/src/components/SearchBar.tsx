import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Fila de búsqueda + botón de filtros (fase 4.3). El botón muestra un badge con los filtros activos distintos de su valor por defecto.
export function SearchBar({ value, onChange, onSubmit, placeholder, filterCount, onOpenFilters }: {
  value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder: string; filterCount: number; onOpenFilters: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Search size={18} color={C.slate500} />
        <TextInput value={value} onChangeText={onChange} onSubmitEditing={onSubmit} placeholder={placeholder} placeholderTextColor={C.slate500}
          accessibilityLabel={placeholder} returnKeyType="search" autoCorrect={false} style={styles.input} />
        {value.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange("")} hitSlop={8} style={styles.clear}><X size={14} color={C.slate700} /></Pressable>
        ) : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={filterCount > 0 ? `Filters, ${filterCount} active` : "Filters"} onPress={onOpenFilters} style={styles.btn}>
        <SlidersHorizontal size={20} color={C.ink} />
        {filterCount > 0 ? <View style={styles.badge}><Text style={styles.badgeT}>{filterCount}</Text></View> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  field: { flex: 1, height: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  input: { flex: 1, fontFamily: font.body, fontSize: 15, color: C.ink, paddingVertical: 0 },
  clear: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  btn: { width: MIN_HIT, height: MIN_HIT, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.ink, borderWidth: 2, borderColor: C.white, alignItems: "center", justifyContent: "center" },
  badgeT: { fontFamily: font.bodyBold, fontSize: 10, color: C.white },
});
