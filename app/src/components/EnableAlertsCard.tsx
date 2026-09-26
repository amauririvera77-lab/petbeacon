import { BellRing, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEnablePush } from "../hooks/useEnablePush";
import { useSession } from "../state/session";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Tarjeta de Home mientras las notificaciones estén apagadas: el botón para activarlas a la vista, no escondido en Profile.
export function EnableAlertsCard() {
  const { alertsCardDismissed, update } = useSession();
  const { on, enable } = useEnablePush();
  if (on || alertsCardDismissed) return null;
  return (
    <View style={styles.box}>
      <View style={styles.icon}><BellRing size={22} color={C.teal} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.t}>Get alerts near you</Text>
        <Text style={styles.s}>Know right away about lost pets nearby and matches for your pet.</Text>
        <Pressable accessibilityRole="button" onPress={() => enable()} style={styles.btn}><Text style={styles.btnT}>Turn on notifications</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => update({ alertsCardDismissed: true })} style={styles.x}>
        <X size={18} color={C.slate500} />
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  t: { fontFamily: font.head, fontSize: 16, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  btn: { minHeight: MIN_HIT, justifyContent: "center", alignSelf: "flex-start" },
  btnT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink, textDecorationLine: "underline" },
  x: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: -10, marginRight: -10 },
});
