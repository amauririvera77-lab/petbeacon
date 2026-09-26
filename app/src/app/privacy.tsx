import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Toggle } from "../components/Toggle";
import { supabase } from "../lib/supabase";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

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
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={C.ink} /></Pressable>
        <Text style={styles.h} accessibilityRole="header">Privacy</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.t}>Include my contact on flyers</Text>
              <Text style={styles.s}>Your phone or email appears on the flyers you create so people can reach you. Turn it off to leave it out.</Text>
            </View>
            <Toggle value={showContact} onValueChange={change} label="Include my contact on flyers" />
          </View>
        </View>
        {SECTIONS.map((s) => (
          <View key={s.title} style={{ gap: 4 }}>
            <Text style={styles.t}>{s.title}</Text>
            <Text style={styles.body}>{s.body}</Text>
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
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  t: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19, color: C.slate700, marginTop: 2 },
  body: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 21, color: C.slate700 },
});
