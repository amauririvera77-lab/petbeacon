import { Eye, Dog, Siren, X } from "lucide-react-native";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NotifItem } from "../hooks/useNotificationsFeed";
import { C, font, radius } from "../theme/tokens";

const STYLE = {
  sighting: { Icon: Eye, tint: C.warnTint, color: C.warn },
  match: { Icon: Dog, tint: C.sosTint, color: C.sosDark },
  lost: { Icon: Siren, tint: C.sosTint, color: C.sosDark },
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
            <Text style={styles.title} accessibilityRole="header">Notifications</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 8 }}>
            {items.length === 0 ? (
              <Text style={styles.empty}>You're all caught up. New sightings and matches near you will show up here.</Text>
            ) : items.map((n) => {
              const { Icon, tint, color } = STYLE[n.kind];
              return (
                <Pressable key={n.id} accessibilityRole="button" onPress={() => onPick(n)} style={({ pressed }) => [styles.item, pressed && { backgroundColor: C.surface }]}>
                  <View style={[styles.icon, { backgroundColor: tint }]}><Icon size={20} color={color} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemT}>{n.title}</Text>
                    <Text style={styles.itemS}>{ago(n.at)}{n.dismissed ? " · Dismissed" : ""}</Text>
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
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: { maxHeight: "72%", backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  title: { fontFamily: font.head, fontSize: 18, color: C.ink },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.md },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  itemT: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  itemS: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500, marginTop: 2 },
  empty: { fontFamily: font.bodyRegular, fontSize: 14, color: C.slate500, padding: 16, textAlign: "center" },
});
