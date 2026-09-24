// 1 · Welcome — contenido centrado; sin CTA: las salidas son los botones de intención y dos enlaces.
import { Bell, Eye } from "lucide-react-native";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Logo } from "../../components/Logo";
import { OnboardingScreen } from "../../components/Screen";
import { Intent, useSession } from "../../state/session";
import { C, font, radius } from "../../theme/tokens";

export default function Welcome() {
  const { update } = useSession();
  const pick = (intent: Intent) => {
    update({ intent });
    router.push("/signup");
  };
  return (
    <OnboardingScreen>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <Logo width={150} />
          <Text style={styles.tagline}>Reunite pets with their people.</Text>
          <Text style={styles.h1} accessibilityRole="header">What brings you here today?</Text>
        </View>
        <View style={styles.buttons}>
          <Pressable accessibilityRole="button" onPress={() => pick("lost")} style={({ pressed }) => [styles.intent, { backgroundColor: C.sos }, pressed && { opacity: 0.9 }]}>
            <Bell size={20} color={C.white} /><Text style={styles.intentT}>I lost my pet</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => pick("seen")} style={({ pressed }) => [styles.intent, { backgroundColor: C.warn }, pressed && { opacity: 0.9 }]}>
            <Eye size={20} color={C.white} /><Text style={styles.intentT}>I see a pet</Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="link" onPress={() => pick("register")} style={styles.link}>
          <Text style={styles.linkT}>Just setting up — I'll register my pet now</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push("/(tabs)/support")} style={[styles.link, { marginTop: 18 }]}>
          <Text style={[styles.linkT, { lineHeight: 20.3 }]}>{"Struggling to care for your pet right now?\nSee local support"}</Text>
        </Pressable>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24 },
  hero: { alignItems: "center", marginBottom: 40 },
  tagline: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 19.6, color: C.slate600, marginTop: 8, textAlign: "center" },
  h1: { fontFamily: font.displayMedium, fontSize: 28, lineHeight: 32.2, letterSpacing: -0.28, color: C.ink, marginTop: 32, textAlign: "center" },
  buttons: { gap: 12, marginBottom: 24 },
  intent: { height: 64, borderRadius: radius.md, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" },
  intentT: { fontFamily: font.bodyBold, fontSize: 17, color: C.white },
  link: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 9, alignItems: "center", justifyContent: "center" },
  linkT: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700, textAlign: "center" },
});
