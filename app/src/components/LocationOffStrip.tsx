import { MapPinOff, X } from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme, MIN_HIT } from "../theme/tokens";
import { typography } from "../theme/typography";

// Ubicación denegada (fase 6.1): explica qué se pierde y ofrece las dos salidas — abrir Ajustes o fijar la zona a mano. Descartable.
export function LocationOffStrip({ onSetZone, onDismiss }: { onSetZone: () => void; onDismiss: () => void }) {
  return (
    <View style={styles.box}>
      <MapPinOff size={20} color={Theme.text.secondary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.t}>Location is off</Text>
        <Text style={styles.s}>We can't show where you are on the map. You still see reports around your saved area.</Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => Linking.openSettings().catch(() => {})} style={styles.btn}><Text style={styles.btnT}>Open settings</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onSetZone} style={styles.btn}><Text style={styles.btnT}>Set area manually</Text></Pressable>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={onDismiss} style={styles.x}><X size={18} color={Theme.text.muted} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Theme.surface.page, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  t: { ...typography.heading16, color: Theme.text.primary },
  s: { ...typography.bodySm13, color: Theme.text.secondary },
  row: { flexDirection: "row", flexWrap: "wrap", columnGap: 20 },
  btn: { minHeight: MIN_HIT, justifyContent: "center" },
  btnT: { ...typography.label14, color: Theme.text.primary, textDecorationLine: "underline" },
  x: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: -8, marginRight: -10 },
});
