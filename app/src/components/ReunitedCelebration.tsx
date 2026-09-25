import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { C, font, radius } from "../theme/tokens";

// Mensaje de celebración en el lugar de la tarjeta de estado cuando el dueño marca "reunited"; se retira solo tras unos segundos.
export function ReunitedCelebration({ name, onDone, ms = 6000 }: { name: string; onDone: () => void; ms?: number }) {
  useEffect(() => { const t = setTimeout(onDone, ms); return () => clearTimeout(t); }, [onDone, ms]);
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.circle}><Check size={24} color={C.white} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>Welcome home, {name}!</Text>
        <Text style={styles.sub}>We're so glad you found each other. We've stopped alerting neighbors about this report.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: C.okTint, borderWidth: 1, borderColor: C.ok },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.ok, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: font.head, fontSize: 17, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 18, color: C.slate700 },
});
