import { router } from "expo-router";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { SUPPORT_EMAIL } from "../lib/config";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

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
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={Theme.text.primary} /></Pressable>
        <AppText role="title" style={styles.h} accessibilityRole="header">Help and FAQ</AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        {FAQ.map((sec) => (
          <View key={sec.title} style={{ marginBottom: 24 }}>
            <AppText style={styles.sec}>{sec.title}</AppText>
            <View style={styles.card}>
              {sec.items.map(([q, a], i) => {
                const key = `${sec.title}-${i}`, on = open === key;
                return (
                  <View key={key} style={i > 0 && styles.divider}>
                    <Pressable accessibilityRole="button" accessibilityState={{ expanded: on }} onPress={() => setOpen(on ? null : key)} style={styles.q}>
                      <AppText style={styles.qT}>{q}</AppText>
                      <View style={on && { transform: [{ rotate: "180deg" }] }}><ChevronDown size={18} color={Theme.text.muted} /></View>
                    </Pressable>
                    {on ? <AppText style={styles.a}>{a}</AppText> : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
        {/* "Still need help?" (Fase 11 de congelación): vía de contacto real al final del FAQ, por si las preguntas no alcanzan. */}
        <View style={styles.help}>
          <AppText style={styles.helpT}>Still need help?</AppText>
          <AppText style={styles.helpS}>Our team usually replies within 2 business days.</AppText>
          <Button variant="secondary" label="Contact us"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => Alert.alert("Couldn't open email", `Reach us at ${SUPPORT_EMAIL}`))} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.surface.page },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, backgroundColor: Theme.surface.card, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  h: { ...typography.title24, color: Theme.text.primary },
  // Label/13 mayúsculas, text/secondary (Fase 10 de congelación — antes text/muted).
  sec: { ...typography.label13, letterSpacing: 0.72, textTransform: "uppercase", color: Theme.text.secondary, marginBottom: 12 },
  card: { borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default, overflow: "hidden" },
  divider: { borderTopWidth: 1, borderTopColor: Theme.border.default },
  q: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 16 },
  // Heading/16 (Fase 10 de congelación — antes Label/14), para compartir estilo de título con "Nearby alerts"/"Edit profile".
  qT: { flex: 1, ...typography.heading16, color: Theme.text.primary },
  a: { ...typography.body14, color: Theme.text.secondary, paddingHorizontal: 16, paddingBottom: 16 },
  help: { padding: 16, borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default, gap: 8 },
  helpT: { ...typography.heading18, color: Theme.text.primary },
  helpS: { ...typography.body14, color: Theme.text.secondary },
});
