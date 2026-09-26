import { X } from "lucide-react-native";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SightingResolution } from "../../lib/database.types";
import { RESOLUTION_LABEL } from "../../lib/myReports";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

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
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
          </View>
          <Text style={styles.sub}>The sighting will stop showing on the map and in the feed.</Text>
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {(Object.keys(RESOLUTION_LABEL) as SightingResolution[]).map((k) => (
              <Pressable key={k} accessibilityRole="button" disabled={busy} onPress={() => onPick(k)} style={({ pressed }) => [styles.option, busy && { opacity: 0.6 }, pressed && { backgroundColor: C.surface }]}>
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
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  title: { flex: 1, fontFamily: font.head, fontSize: 18, color: C.ink },
  close: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  sub: { fontFamily: font.bodyRegular, fontSize: 14, color: C.slate700, paddingHorizontal: 20, paddingBottom: 12 },
  option: { minHeight: 52, justifyContent: "center", paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2 },
  optT: { fontFamily: font.bodySemi, fontSize: 15, color: C.ink },
});
