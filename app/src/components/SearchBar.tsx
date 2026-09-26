import { Search, X } from "lucide-react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Campo de búsqueda (fase 4.3). El botón de filtros vive ahora en la fila de chips (FilterButton).
export function SearchBar({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder: string }) {
  return (
    <View style={styles.field}>
      <Search size={18} color={C.slate500} />
      <TextInput value={value} onChangeText={onChange} onSubmitEditing={onSubmit} placeholder={placeholder} placeholderTextColor={C.slate500}
        accessibilityLabel={placeholder} returnKeyType="search" autoCorrect={false} style={styles.input} />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange("")} hitSlop={8} style={styles.clear}><X size={14} color={C.slate700} /></Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { height: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  input: { flex: 1, fontFamily: font.body, fontSize: 15, color: C.ink, paddingVertical: 0 },
  clear: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
});
