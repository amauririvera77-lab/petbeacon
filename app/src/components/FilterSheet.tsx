import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { activeFilterCount } from "../lib/homeFilters";
import { AgeFilter, Prefs, SpeciesFilter, ViewRadius } from "../state/homePrefs";
import { C, MIN_HIT, font, radius } from "../theme/tokens";
import { Toggle } from "./Toggle";

function Pills<T extends string | number>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pills} accessibilityRole="radiogroup">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={String(o.value)} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => onChange(o.value)}
              style={[styles.pill, on && styles.pillOn]}>
              <Text style={[styles.pillT, { color: on ? C.white : C.ink }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Hoja de filtros (fase 4.3): especie, radio (1/5/10 mi), antigüedad (24h / 7 days / All) y "Show reunited" (apagado por defecto).
// El radio es el de VISUALIZACIÓN: no cambia el radio de alertas del perfil.
export function FilterSheet({ visible, prefs, onChange, onReset, onClose }: {
  visible: boolean; prefs: Prefs; onChange: (p: Partial<Prefs>) => void; onReset: () => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const count = activeFilterCount(prefs);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close filters" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">Filters</Text>
            <Pressable accessibilityRole="button" onPress={onReset} style={styles.reset}><Text style={styles.resetT}>Reset filters</Text></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 24 }}>
            <Pills<SpeciesFilter> label="Species" value={prefs.species} onChange={(species) => onChange({ species })}
              options={[{ value: "all", label: "All" }, { value: "dog", label: "Dogs" }, { value: "cat", label: "Cats" }, { value: "other", label: "Other" }]} />
            <Pills<ViewRadius> label="Radius" value={prefs.viewRadiusMi} onChange={(viewRadiusMi) => onChange({ viewRadiusMi })}
              options={[{ value: 1, label: "1 mi" }, { value: 5, label: "5 mi" }, { value: 10, label: "10 mi" }]} />
            <Pills<AgeFilter> label="Posted" value={prefs.age} onChange={(age) => onChange({ age })}
              options={[{ value: "24h", label: "Last 24h" }, { value: "7d", label: "Last 7 days" }, { value: "all", label: "All" }]} />
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleT}>Show reunited</Text>
                <Text style={styles.toggleS}>Include cases that were closed in the last 24h.</Text>
              </View>
              <Toggle value={prefs.showReunited} onValueChange={(showReunited) => onChange({ showReunited })} label="Show reunited" />
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.done}>
              <Text style={styles.doneT}>Done{count > 0 ? ` · ${count} active` : ""}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: { maxHeight: "80%", backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontFamily: font.head, fontSize: 18, color: C.ink },
  reset: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 4 },
  resetT: { fontFamily: font.bodyBold, fontSize: 14, color: C.slate700, textDecorationLine: "underline" },
  label: { fontFamily: font.bodyBold, fontSize: 13, color: C.slate700 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { minHeight: MIN_HIT, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  pillOn: { backgroundColor: C.ink, borderColor: C.ink },
  pillT: { fontFamily: font.bodySemi, fontSize: 14 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  toggleT: { fontFamily: font.bodySemi, fontSize: 15, color: C.ink },
  toggleS: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500 },
  footer: { paddingHorizontal: 20, paddingTop: 8 },
  done: { height: 56, borderRadius: radius.md, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  doneT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
});
