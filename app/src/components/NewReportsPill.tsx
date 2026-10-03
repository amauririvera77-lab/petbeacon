import { ArrowUp } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

// Píldora flotante "3 new reports" (fase 6.6): las novedades detectadas por el polling NO mueven la lista; el usuario decide cuándo verlas.
export function NewReportsPill({ count, top, onPress }: { count: number; top: number; onPress: () => void }) {
  if (count <= 0) return null;
  const label = `${count} new ${count === 1 ? "report" : "reports"}`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Show ${label}`} onPress={onPress} style={({ pressed }) => [styles.pill, { top }, pressed && { opacity: 0.9 }]}>
      <ArrowUp size={16} color={Theme.text.onAccent} />
      <Text style={styles.t}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { position: "absolute", alignSelf: "center", zIndex: 20, minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: Theme.brand.primary, ...elevation[2] },
  t: { ...typography.button14, color: Theme.text.onAccent },
});
