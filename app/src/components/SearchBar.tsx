import { Search, X } from "lucide-react-native";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Campo de búsqueda (fase 4.3). El botón de filtros vive ahora en la fila de chips (FilterButton).
export function SearchBar({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (v: string) => void; onSubmit?: () => void; placeholder: string }) {
  return (
    <View style={styles.field}>
      <Search size={18} color={Theme.text.muted} />
      <TextInput value={value} onChangeText={onChange} onSubmitEditing={onSubmit} placeholder={placeholder} placeholderTextColor={Theme.text.muted}
        accessibilityLabel={placeholder} returnKeyType="search" autoCorrect={false} style={styles.input} />
      {value.length > 0 ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChange("")} hitSlop={8} style={styles.clear}><X size={14} color={Theme.text.secondary} /></Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { height: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: Theme.surface.page, borderWidth: 1, borderColor: Theme.border.default },
  input: { flex: 1, ...typography.bodyLg16, color: Theme.text.primary, paddingVertical: 0 },
  clear: { width: 24, height: 24, borderRadius: 12, backgroundColor: Theme.border.default, alignItems: "center", justifyContent: "center" },
});
