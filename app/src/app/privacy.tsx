import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toggle } from "../components/Toggle";
import { supabase } from "../lib/supabase";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Privacy: describe el comportamiento REAL de la app (no promete lo que no existe) y ofrece el único control que hoy tiene efecto:
// incluir o no tu teléfono/correo en los flyers que generes.
const SECTIONS = [
  { title: "What other people can see", body: "For a lost or sighted pet: the photo, name, breed, description, when it happened and the area where it was last seen. The map shows that spot, not your home address." },
  { title: "Your contact details", body: "The phone or email you add to a lost-pet report is private. It's never shown in the app to other people. The only place it can appear is on a flyer you create yourself." },
  { title: "Your pets' microchip number", body: "Only you can see it. It's never shown publicly and it isn't copied into your reports." },
  { title: "Your location", body: "Alerts use the alert area saved in your profile, not your live location. Your phone's location is used only to show you on the map while the app is open." },
] as const;

export default function Privacy() {
  const insets = useSafeAreaInsets();
  const [showContact, setShowContact] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!supabase) return;
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return;
      setUid(s.session.user.id);
      const { data } = await supabase.from("profiles").select("flyer_show_contact").eq("id", s.session.user.id).maybeSingle();
      if (data) setShowContact(data.flyer_show_contact !== false);
    })();
  }, []);

  const change = async (v: boolean) => {
    setShowContact(v);
    if (!supabase || !uid) return;
    const { error } = await supabase.from("profiles").update({ flyer_show_contact: v }).eq("id", uid);
    if (error) { setShowContact(!v); console.warn("flyer_show_contact:", error.message); }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={Theme.text.primary} /></Pressable>
        <AppText role="title" style={styles.h} accessibilityRole="header">Privacy</AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <AppText style={styles.t}>Include my contact on flyers</AppText>
              <AppText style={styles.s}>Your phone or email appears on the flyers you create so people can reach you. Turn it off to leave it out.</AppText>
            </View>
            <Toggle value={showContact} onValueChange={change} label="Include my contact on flyers" />
          </View>
        </View>
        {SECTIONS.map((s) => (
          <View key={s.title} style={{ gap: 4 }}>
            <AppText style={styles.t}>{s.title}</AppText>
            <AppText style={styles.body}>{s.body}</AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.surface.page },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, backgroundColor: Theme.surface.card, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  h: { ...typography.title24, color: Theme.text.primary },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  t: { ...typography.label14, color: Theme.text.primary },
  s: { ...typography.bodySm13, color: Theme.text.secondary, marginTop: 2 },
  body: { ...typography.body14, color: Theme.text.secondary },
});
