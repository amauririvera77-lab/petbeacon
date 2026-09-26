import { RotateCcw, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MyMatch } from "../lib/database.types";
import { matchSubtitle, matchTitle } from "../lib/matchCopy";
import { C, MIN_HIT, font, radius } from "../theme/tokens";
import { FocusImage } from "./FocusImage";
import { SpeciesPlaceholder } from "./SpeciesPlaceholder";

// Coincidencias de un reporte Lost, incluidas las descartadas (fase 1.3): nada se borra, todo se puede recuperar.
export function MatchesSheet({ lostName, matches, onClose, onView, onDismiss, onRestore }: {
  lostName: string; matches: MyMatch[] | null; onClose: () => void;
  onView: (m: MyMatch) => void; onDismiss: (id: string) => void; onRestore: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={!!matches} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">Matches for {lostName}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {(matches ?? []).length === 0 ? (
              <Text style={styles.empty}>No matches yet. We'll alert you when a sighting fits {lostName}.</Text>
            ) : (matches ?? []).map((m) => (
              <View key={m.id} style={[styles.item, m.dismissed && styles.itemDismissed]}>
                <View style={styles.row}>
                  {m.sighted_photo_url ? (
                    <FocusImage uri={m.sighted_photo_url} focusX={m.sighted_focus_x} focusY={m.sighted_focus_y} zoom={(m.sighted_zoom ?? 100) / 100} style={styles.photo} />
                  ) : <SpeciesPlaceholder species={m.sighted_species ?? "other"} size={48} style={styles.photo} />}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.itemT}>{matchTitle(m)}{m.dismissed ? "  ·  Dismissed" : ""}</Text>
                    <Text style={styles.itemS}>{matchSubtitle(m)}</Text>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" onPress={() => onView(m)} style={styles.btn}><Text style={styles.btnT}>View sighting</Text></Pressable>
                  {m.dismissed ? (
                    <Pressable accessibilityRole="button" onPress={() => onRestore(m.id)} style={[styles.btn, styles.btnRestore]}>
                      <RotateCcw size={14} color={C.ink} /><Text style={styles.btnT}>Restore</Text>
                    </Pressable>
                  ) : (
                    <Pressable accessibilityRole="button" onPress={() => onDismiss(m.id)} style={styles.btn}><Text style={[styles.btnT, { color: C.slate700 }]}>Dismiss</Text></Pressable>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: { maxHeight: "78%", backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { flex: 1, fontFamily: font.head, fontSize: 18, color: C.ink },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  empty: { fontFamily: font.bodyRegular, fontSize: 14, color: C.slate500, textAlign: "center", padding: 16 },
  item: { padding: 12, gap: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: C.ok, backgroundColor: C.okTint },
  itemDismissed: { borderColor: C.border, backgroundColor: C.surface },
  row: { flexDirection: "row", gap: 12 },
  photo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: C.white },
  itemT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
  itemS: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 18, color: C.slate700 },
  actions: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, minHeight: MIN_HIT, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white },
  btnRestore: { borderColor: C.ok },
  btnT: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
});
