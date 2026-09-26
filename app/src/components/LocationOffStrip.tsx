import { MapPinOff, X } from "lucide-react-native";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font } from "../theme/tokens";

// Ubicación denegada (fase 6.1): explica qué se pierde y ofrece las dos salidas — abrir Ajustes o fijar la zona a mano. Descartable.
export function LocationOffStrip({ onSetZone, onDismiss }: { onSetZone: () => void; onDismiss: () => void }) {
  return (
    <View style={styles.box}>
      <MapPinOff size={20} color={C.slate700} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.t}>Location is off</Text>
        <Text style={styles.s}>We can't show where you are on the map. You still see reports around your saved area.</Text>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" onPress={() => Linking.openSettings().catch(() => {})} style={styles.btn}><Text style={styles.btnT}>Open settings</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={onSetZone} style={styles.btn}><Text style={styles.btnT}>Set area manually</Text></Pressable>
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={onDismiss} style={styles.x}><X size={18} color={C.slate500} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  t: { fontFamily: font.head, fontSize: 15, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 18, color: C.slate700 },
  row: { flexDirection: "row", flexWrap: "wrap", columnGap: 20 },
  btn: { minHeight: MIN_HIT, justifyContent: "center" },
  btnT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink, textDecorationLine: "underline" },
  x: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: -8, marginRight: -10 },
});
