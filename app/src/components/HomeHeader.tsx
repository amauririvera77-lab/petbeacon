import { Bell } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font } from "../theme/tokens";
import { Logo } from "./Logo";

// Header de Home (prototipo): logo a la izquierda, campana con badge a la derecha. 64px de alto.
export function HomeHeader({ unread, onBell }: { unread: number; onBell: () => void }) {
  return (
    <View style={styles.bar}>
      <Logo width={115} />
      <Pressable accessibilityRole="button" accessibilityLabel={unread > 0 ? `Notifications, ${unread} new` : "Notifications"} onPress={onBell} style={styles.bell}>
        <Bell size={22} color={C.slate700} />
        {unread > 0 ? (
          <View style={styles.badge}><Text style={styles.badgeT}>{unread > 9 ? "9+" : unread}</Text></View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  bell: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  badge: { position: "absolute", top: 2, right: 2, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, backgroundColor: C.sos, borderWidth: 2, borderColor: C.white, alignItems: "center", justifyContent: "center" },
  badgeT: { fontFamily: font.bodyBold, fontSize: 10, lineHeight: 12, color: C.white },
});
