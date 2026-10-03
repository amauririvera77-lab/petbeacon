import { Eye, Dog, Siren, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NotifItem } from "../hooks/useNotificationsFeed";
import { Theme, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

const STYLE = {
  sighting: { Icon: Eye, tint: Theme.status.sighted.tint, color: Theme.status.sighted.bg },
  match: { Icon: Dog, tint: Theme.status.lost.tint, color: Theme.status.lost.bgStrong },
  lost: { Icon: Siren, tint: Theme.status.lost.tint, color: Theme.status.lost.bgStrong },
} as const;

function ago(at: number) {
  const m = Math.floor((Date.now() - at) / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} hour${h === 1 ? "" : "s"} ago` : `${Math.floor(h / 24)} day${h >= 48 ? "s" : ""} ago`;
}

export function NotificationsSheet({ visible, items, onClose, onPick }: {
  visible: boolean; items: NotifItem[]; onClose: () => void; onPick: (i: NotifItem) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close notifications" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.head}>
            <AppText style={styles.title} accessibilityRole="header">Notifications</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={Theme.text.secondary} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 8 }}>
            {items.length === 0 ? (
              <AppText style={styles.empty}>You're all caught up. New sightings and matches near you will show up here.</AppText>
            ) : items.map((n) => {
              const { Icon, tint, color } = STYLE[n.kind];
              return (
                <Pressable key={n.id} accessibilityRole="button" onPress={() => onPick(n)} style={({ pressed }) => [styles.item, pressed && { backgroundColor: Theme.surface.page }]}>
                  <View style={[styles.icon, { backgroundColor: tint }]}><Icon size={20} color={color} /></View>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.itemT}>{n.title}</AppText>
                    <AppText style={styles.itemS}>{ago(n.at)}{n.dismissed ? " · Dismissed" : ""}</AppText>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.scrim(0.5) },
  sheet: { maxHeight: "72%", backgroundColor: Theme.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...elevation[3] },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border.default },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  title: { ...typography.heading18, color: Theme.text.primary },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.md },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  itemT: { ...typography.label14, color: Theme.text.primary },
  itemS: { ...typography.caption12, color: Theme.text.muted, marginTop: 2 },
  empty: { ...typography.body14, color: Theme.text.muted, padding: 16, textAlign: "center" },
});
