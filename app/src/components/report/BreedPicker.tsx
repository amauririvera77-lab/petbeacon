import { Check, ChevronDown, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EMPTY_BREED, MIXED_ID, MIXED_LABEL, OTHER_ID, breedDisplay, searchBreeds, type BreedValue } from "../../lib/breeds";
import type { Species } from "../../lib/database.types";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

// Selector de raza con búsqueda y autocompletado (evaluación de Pet profile 2.1): reemplaza el texto libre. Lista de razas según la especie,
// más "Mixed / Not sure" y, como último recurso, "Other" con texto libre. Guarda el id canónico (y el texto para mostrarlo).
export function BreedPicker({ label = "Breed", optional, species, value, onChange }: {
  label?: string; optional?: boolean; species: Species | null; value: BreedValue; onChange: (v: BreedValue) => void;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [otherMode, setOtherMode] = useState(false);
  const [otherText, setOtherText] = useState("");
  const results = useMemo(() => searchBreeds(species, q), [species, q]);
  const shown = breedDisplay(value);
  const disabled = !species;

  const close = () => { setOpen(false); setQ(""); setOtherMode(false); };
  const openIt = () => { setOtherMode(false); setOtherText(value.id === OTHER_ID ? value.text : ""); setQ(""); setOpen(true); };
  const pick = (v: BreedValue) => { onChange(v); close(); };

  type Row = { key: string; label: string; onPress: () => void; selected: boolean };
  const rows: Row[] = [
    ...results.map((b) => ({ key: b.id, label: b.label, selected: value.id === b.id, onPress: () => pick({ id: b.id, text: b.label }) })),
    { key: MIXED_ID, label: MIXED_LABEL, selected: value.id === MIXED_ID, onPress: () => pick({ id: MIXED_ID, text: "Mixed breed" }) },
    { key: OTHER_ID, label: "Other", selected: value.id === OTHER_ID, onPress: () => setOtherMode(true) },
  ];

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}{optional ? <Text style={styles.opt}> (optional)</Text> : null}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${shown || "not set"}`} disabled={disabled} onPress={openIt}
        style={[styles.field, disabled && { backgroundColor: C.surface }]}>
        <Text style={[styles.fieldT, !shown && { color: C.slate500 }]} numberOfLines={1}>
          {shown || (disabled ? "Choose the type first" : "Select a breed")}
        </Text>
        <ChevronDown size={18} color={C.slate500} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Pressable style={styles.scrim} onPress={close} accessibilityLabel="Close" />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.handleWrap}><View style={styles.handle} /></View>
            <View style={styles.head}>
              <Text style={styles.title} accessibilityRole="header">{otherMode ? "Other breed" : label}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
            </View>
            {otherMode ? (
              <View style={{ padding: 16, gap: 12 }}>
                <Text style={styles.help}>Describe the breed in your own words.</Text>
                <TextInput value={otherText} onChangeText={setOtherText} placeholder="e.g. Chiweenie" placeholderTextColor={C.slate500} autoFocus maxLength={40}
                  accessibilityLabel="Other breed" style={styles.input} />
                <Pressable accessibilityRole="button" disabled={!otherText.trim()} onPress={() => pick({ id: OTHER_ID, text: otherText.trim() })}
                  style={[styles.done, !otherText.trim() && { backgroundColor: C.border }]}>
                  <Text style={[styles.doneT, !otherText.trim() && { color: C.slate500 }]}>Done</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.search}>
                  <Search size={18} color={C.slate500} />
                  <TextInput value={q} onChangeText={setQ} placeholder="Search breeds" placeholderTextColor={C.slate500} autoCorrect={false} autoFocus
                    accessibilityLabel="Search breeds" style={styles.searchInput} />
                  {q ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQ("")} hitSlop={8}><X size={16} color={C.slate500} /></Pressable> : null}
                </View>
                <FlatList data={rows} keyExtractor={(r) => r.key} keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}
                  renderItem={({ item }) => (
                    <Pressable accessibilityRole="button" accessibilityState={{ selected: item.selected }} onPress={item.onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.surface }]}>
                      <Text style={[styles.rowT, item.selected && { fontFamily: font.bodyBold }]}>{item.label}</Text>
                      {item.selected ? <Check size={18} color={C.ink} /> : null}
                    </Pressable>
                  )} />
                {value.id || value.text ? (
                  <Pressable accessibilityRole="button" onPress={() => pick(EMPTY_BREED)} style={styles.clear}><Text style={styles.clearT}>Clear selection</Text></Pressable>
                ) : null}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700 },
  opt: { fontFamily: font.bodyRegular, color: C.slate500 },
  field: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white },
  fieldT: { flex: 1, fontFamily: font.body, fontSize: 16, color: C.ink },
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: { maxHeight: "85%", backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontFamily: font.head, fontSize: 18, color: C.ink },
  close: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  search: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, height: MIN_HIT, borderRadius: radius.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, fontFamily: font.body, fontSize: 15, color: C.ink, paddingVertical: 0 },
  row: { minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: C.border },
  rowT: { flex: 1, fontFamily: font.body, fontSize: 15, color: C.ink },
  clear: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderTopColor: C.border },
  clearT: { fontFamily: font.bodyBold, fontSize: 14, color: C.slate700, textDecorationLine: "underline" },
  help: { fontFamily: font.bodyRegular, fontSize: 14, color: C.slate700 },
  input: { minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, paddingHorizontal: 14, fontFamily: font.body, fontSize: 16, color: C.ink },
  done: { height: 52, borderRadius: radius.md, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  doneT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
});
