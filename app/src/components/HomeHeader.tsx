import { Bell } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, MIN_HIT } from "../theme/tokens";
import { typography } from "../theme/typography";
import { Logo } from "./Logo";

// Header de Home (prototipo): logo a la izquierda, campana con badge a la derecha. 64px de alto.
export function HomeHeader({ unread, onBell }: { unread: number; onBell: () => void }) {
  return (
    <View style={styles.bar}>
      <Logo width={115} />
      <Pressable accessibilityRole="button" accessibilityLabel={unread > 0 ? `Notifications, ${unread} new` : "Notifications"} onPress={onBell} style={styles.bell}>
        <Bell size={22} color={Theme.text.secondary} />
        {unread > 0 ? (
          <View style={styles.badge}><Text style={styles.badgeT}>{unread > 9 ? "9+" : unread}</Text></View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, backgroundColor: Theme.surface.card, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  bell: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  // danger.bg, no status.lost.bg: este badge indica "tienes notificaciones sin leer" (de cualquier tipo — match,
  // avistamiento, etc.), no el estado Lost de un reporte puntual (CLAUDE.md, colores de estado).
  badge: { position: "absolute", top: 2, right: 2, minWidth: 18, height: 18, paddingHorizontal: 3, borderRadius: 9, backgroundColor: Theme.danger.bg, borderWidth: 2, borderColor: Theme.surface.card, alignItems: "center", justifyContent: "center" },
  badgeT: { ...typography.micro11, color: Theme.text.onAccent },
});
