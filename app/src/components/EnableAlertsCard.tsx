import { BellRing, X } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { useEnablePush } from "../hooks/useEnablePush";
import { useSession } from "../state/session";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Tarjeta de Home mientras las notificaciones estén apagadas: el botón para activarlas a la vista, no escondido en Profile.
export function EnableAlertsCard() {
  const { alertsCardDismissed, update } = useSession();
  const { on, enable } = useEnablePush();
  if (on || alertsCardDismissed) return null;
  return (
    <View style={styles.box}>
      <View style={styles.icon}><BellRing size={22} color={Theme.brand.primary} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={styles.t}>Get alerts near you</AppText>
        <AppText style={styles.s}>Know right away about lost pets nearby and matches for your pet.</AppText>
        <Pressable accessibilityRole="button" onPress={() => enable()} style={styles.btn}><AppText style={styles.btnT}>Turn on notifications</AppText></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => update({ alertsCardDismissed: true })} style={styles.x}>
        <X size={18} color={Theme.text.muted} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: Theme.surface.page, borderWidth: 1, borderColor: Theme.border.default },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Theme.border.default, alignItems: "center", justifyContent: "center" },
  t: { ...typography.heading16, color: Theme.text.primary },
  s: { ...typography.bodySm13, color: Theme.text.secondary },
  btn: { minHeight: MIN_HIT, justifyContent: "center", alignSelf: "flex-start" },
  btnT: { ...typography.label14, color: Theme.text.primary, textDecorationLine: "underline" },
  x: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: -10, marginRight: -10 },
});
