import { RotateCcw, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MyMatch } from "../lib/database.types";
import { matchSubtitle, matchTitle } from "../lib/matchCopy";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";
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
            <AppText style={styles.title} accessibilityRole="header">Matches for {lostName}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={Theme.text.secondary} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
            {(matches ?? []).length === 0 ? (
              <AppText style={styles.empty}>No matches yet. We'll alert you when a sighting fits {lostName}.</AppText>
            ) : (matches ?? []).map((m) => (
              <View key={m.id} style={[styles.item, m.dismissed && styles.itemDismissed]}>
                <View style={styles.row}>
                  {m.sighted_photo_url ? (
                    <FocusImage uri={m.sighted_photo_url} focusX={m.sighted_focus_x} focusY={m.sighted_focus_y} style={styles.photo} />
                  ) : <SpeciesPlaceholder species={m.sighted_species ?? "other"} size={48} style={styles.photo} />}
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText style={styles.itemT}>{matchTitle(m)}{m.dismissed ? "  ·  Dismissed" : ""}</AppText>
                    <AppText style={styles.itemS}>{matchSubtitle(m)}</AppText>
                  </View>
                </View>
                <View style={styles.actions}>
                  <Pressable accessibilityRole="button" onPress={() => onView(m)} style={styles.btn}><AppText role="control" style={styles.btnT}>View sighting</AppText></Pressable>
                  {m.dismissed ? (
                    <Pressable accessibilityRole="button" onPress={() => onRestore(m.id)} style={[styles.btn, styles.btnRestore]}>
                      <RotateCcw size={14} color={Theme.text.primary} /><AppText role="control" style={styles.btnT}>Restore</AppText>
                    </Pressable>
                  ) : (
                    <Pressable accessibilityRole="button" onPress={() => onDismiss(m.id)} style={styles.btn}><AppText role="control" style={[styles.btnT, { color: Theme.text.secondary }]}>Dismiss</AppText></Pressable>
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
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.scrim(0.5) },
  sheet: { maxHeight: "78%", backgroundColor: Theme.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...elevation[3] },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border.default },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  title: { flex: 1, ...typography.heading18, color: Theme.text.primary },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.border.default, alignItems: "center", justifyContent: "center" },
  empty: { ...typography.body14, color: Theme.text.muted, textAlign: "center", padding: 16 },
  item: { padding: 12, gap: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.status.reunited.bg, backgroundColor: Theme.status.reunited.tint },
  itemDismissed: { borderColor: Theme.border.default, backgroundColor: Theme.surface.page },
  row: { flexDirection: "row", gap: 12 },
  photo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: Theme.surface.card },
  itemT: { ...typography.label14, color: Theme.text.primary },
  itemS: { ...typography.bodySm13, color: Theme.text.secondary },
  actions: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, minHeight: MIN_HIT, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card },
  btnRestore: { borderColor: Theme.status.reunited.bg },
  btnT: { ...typography.button14, color: Theme.text.primary },
});
