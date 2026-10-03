import { Check } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Mensaje de celebración en el lugar de la tarjeta de estado cuando el dueño marca "reunited"; se retira solo tras unos segundos.
export function ReunitedCelebration({ name, onDone, ms = 6000 }: { name: string; onDone: () => void; ms?: number }) {
  useEffect(() => { const t = setTimeout(onDone, ms); return () => clearTimeout(t); }, [onDone, ms]);
  return (
    <View style={styles.box} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.circle}><Check size={24} color={Theme.text.onAccent} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.title}>Welcome home, {name}!</Text>
        <Text style={styles.sub}>We're so glad you found each other. We've stopped alerting neighbors about this report.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: Theme.status.reunited.tint, borderWidth: 1, borderColor: Theme.status.reunited.bg },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Theme.status.reunited.bg, alignItems: "center", justifyContent: "center" },
  title: { ...typography.heading18, color: Theme.text.primary },
  sub: { ...typography.bodySm13, color: Theme.text.secondary },
});
