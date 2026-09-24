import { router } from "expo-router";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// La sección "Support and care" es deliberada (refuerza el diferenciador del producto, CLAUDE.md §2 y §1).
const FAQ = [
  { title: "Reporting a pet", items: [
    ["What happens after I publish an alert?", "Nearby users are notified immediately, and your alert stays active until you mark it as reunited or edit it."],
    ["How does the automatic match work?", "We compare new sightings against your active report by species, breed, and location to suggest possible matches."],
    ["Can I edit or close a report after publishing?", "Yes, from My Reports you can edit any active report or mark it as reunited at any time."],
    // El prototipo decía que solo se muestra "la intersección más cercana"; los pines reales usan el punto exacto del reporte.
    ["Is my exact location made public?", "The map shows the spot where a pet was last seen or spotted — not your home address. Your phone number or email is never shown in the app; it only appears on a flyer if you choose to share one."],
  ] },
  { title: "Support and care", items: [
    ["Who can use these resources?", "Anyone in the area — there's no eligibility check or paperwork required for most listings."],
    ["Do I need to qualify financially?", "Some resources use sliding-scale fees, but most are free and open to all pet owners."],
    ["How do I contact a resource?", "Tap \"Contact\" on any listing to call, message, or view directions directly."],
  ] },
] as const;

export default function Help() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<string | null>(null);
  return (
    <View style={styles.root}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={C.ink} /></Pressable>
        <Text style={styles.h} accessibilityRole="header">Help and FAQ</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        {FAQ.map((sec) => (
          <View key={sec.title} style={{ marginBottom: 24 }}>
            <Text style={styles.sec}>{sec.title}</Text>
            <View style={styles.card}>
              {sec.items.map(([q, a], i) => {
                const key = `${sec.title}-${i}`, on = open === key;
                return (
                  <View key={key} style={i > 0 && styles.divider}>
                    <Pressable accessibilityRole="button" accessibilityState={{ expanded: on }} onPress={() => setOpen(on ? null : key)} style={styles.q}>
                      <Text style={styles.qT}>{q}</Text>
                      <View style={on && { transform: [{ rotate: "180deg" }] }}><ChevronDown size={18} color={C.slate500} /></View>
                    </Pressable>
                    {on ? <Text style={styles.a}>{a}</Text> : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  h: { fontFamily: font.displayMedium, fontSize: 22, color: C.ink },
  sec: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 0.72, textTransform: "uppercase", color: C.slate500, marginBottom: 12 },
  card: { borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  divider: { borderTopWidth: 1, borderTopColor: C.border },
  q: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 16 },
  qT: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  a: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 21, color: C.slate700, paddingHorizontal: 16, paddingBottom: 16 },
});
