import { ArrowUp } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Píldora flotante "3 new reports" (fase 6.6): las novedades detectadas por el polling NO mueven la lista; el usuario decide cuándo verlas.
export function NewReportsPill({ count, top, onPress }: { count: number; top: number; onPress: () => void }) {
  if (count <= 0) return null;
  const label = `${count} new ${count === 1 ? "report" : "reports"}`;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Show ${label}`} onPress={onPress} style={({ pressed }) => [styles.pill, { top }, pressed && { opacity: 0.9 }]}>
      <ArrowUp size={16} color={C.white} />
      <Text style={styles.t}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { position: "absolute", alignSelf: "center", zIndex: 20, minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, borderRadius: radius.pill, backgroundColor: C.ink, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 6 },
  t: { fontFamily: font.bodyBold, fontSize: 14, color: C.white },
});
