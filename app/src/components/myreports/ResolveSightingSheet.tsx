import { X } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SightingResolution } from "../../lib/database.types";
import { RESOLUTION_LABEL } from "../../lib/myReports";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { elevation } from "../../theme/elevation";
import { typography } from "../../theme/typography";

// "Mark as resolved" (My Reports 4.1): tres razones. Un avistamiento resuelto deja de mostrarse en el feed y el mapa y no genera coincidencias.
export function ResolveSightingSheet({ visible, busy, onClose, onPick }: { visible: boolean; busy?: boolean; onClose: () => void; onPick: (r: SightingResolution) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">What happened?</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={Theme.text.secondary} /></Pressable>
          </View>
          <Text style={styles.sub}>The sighting will stop showing on the map and in the feed.</Text>
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {(Object.keys(RESOLUTION_LABEL) as SightingResolution[]).map((k) => (
              <Pressable key={k} accessibilityRole="button" disabled={busy} onPress={() => onPick(k)} style={({ pressed }) => [styles.option, busy && { opacity: 0.6 }, pressed && { backgroundColor: Theme.surface.page }]}>
                <Text style={styles.optT}>{RESOLUTION_LABEL[k]}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.scrim(0.5) },
  sheet: { backgroundColor: Theme.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...elevation[3] },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border.default },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  title: { flex: 1, ...typography.heading18, color: Theme.text.primary },
  close: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  sub: { ...typography.body14, color: Theme.text.secondary, paddingHorizontal: 20, paddingBottom: 12 },
  option: { minHeight: 52, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong },
  optT: { ...typography.label14, color: Theme.text.primary },
});
