// 1 · Welcome — contenido centrado; sin CTA: las salidas son los botones de intención y dos enlaces.
import { Eye, Siren } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { SaveAccountSheet } from "../../components/account/SaveAccountSheet";
import { IntentOption } from "../../components/IntentOption";
import { Logo } from "../../components/Logo";
import { OnboardingScreen } from "../../components/Screen";
import { registerPush } from "../../lib/push";
import { snapRadius } from "../../lib/radius";
import { supabase } from "../../lib/supabase";
import { useOnboardingPreview } from "../../state/onboardingPreview";
import { Intent, useSession } from "../../state/session";
import { Theme } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function Welcome() {
  const { update } = useSession();
  const preview = useOnboardingPreview();
  const [loginOpen, setLoginOpen] = useState(false);
  // Tras entrar en una cuenta ya guardada se trae su perfil y se salta el onboarding.
  const onLoggedIn = async () => {
    setLoginOpen(false);
    if (supabase) {
      const { data: s } = await supabase.auth.getSession();
      if (s.session) {
        registerPush(s.session.user.id, null); // este teléfono vuelve a recibir los avisos de la cuenta (solo si ya dio permiso)
        const { data: p } = await supabase.from("profiles").select("name,city,alert_radius_mi,nearby_alerts_enabled,match_updates_enabled,avatar_url").eq("id", s.session.user.id).maybeSingle();
        if (p) update({ name: p.name, city: p.city, alertRadiusMi: snapRadius(p.alert_radius_mi), nearbyEnabled: p.nearby_alerts_enabled, matchEnabled: p.match_updates_enabled, pushEnabled: p.nearby_alerts_enabled || p.match_updates_enabled, avatarUrl: p.avatar_url });
      }
    }
    update({ onboarded: true });
    router.replace("/(tabs)");
  };
  const pick = (intent: Intent) => {
    update({ intent });
    router.push("/signup");
  };
  return (
    <OnboardingScreen>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <Logo width={150} />
          <AppText style={styles.tagline}>Reunite pets with their people.</AppText>
          <AppText role="title" style={styles.h1} accessibilityRole="header">What brings you here today?</AppText>
        </View>
        {/* Mismo patrón que ReportSheet ("What would you like to report?"): tarjeta neutra, color de estado solo en
            el círculo del ícono — nunca en el fondo del botón (CLAUDE.md). Mismos textos e íconos que esa hoja. */}
        <View style={styles.buttons}>
          <IntentOption title="I lost my pet" sub="Alert neighbors and start the search" Icon={Siren} color={Theme.status.lost.bg} onPress={() => pick("lost")} />
          <IntentOption title="I saw a pet" sub="Help a lost pet get back to its owner" Icon={Eye} color={Theme.status.sighted.bg} onPress={() => pick("seen")} />
        </View>
        <Pressable accessibilityRole="link" onPress={() => pick("register")} style={styles.link}>
          <AppText style={styles.linkT}>Just setting up — I'll register my pet now</AppText>
        </Pressable>
        {/* En vista previa (Design tools) se ocultan: llevarían a una cuenta o pantalla REALES, fuera del sandbox del onboarding. */}
        {!preview.active ? (
          <>
            <Pressable accessibilityRole="link" onPress={() => router.push("/(tabs)/support")} style={[styles.link, { marginTop: 18 }]}>
              <AppText style={styles.linkT}>{"Struggling to care for your pet right now?\nSee local support"}</AppText>
            </Pressable>
            <Pressable accessibilityRole="link" onPress={() => setLoginOpen(true)} style={[styles.link, { marginTop: 10 }]}>
              <AppText style={styles.linkT}>Already saved your account? Log in</AppText>
            </Pressable>
          </>
        ) : null}
      </View>
      <SaveAccountSheet visible={loginOpen} mode="login" onClose={() => setLoginOpen(false)} onDone={onLoggedIn} />
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 24 },
  hero: { alignItems: "center", marginBottom: 40 },
  tagline: { ...typography.body14, color: Theme.text.secondary, marginTop: 8, textAlign: "center" },
  h1: { ...typography.display28, color: Theme.text.primary, marginTop: 32, textAlign: "center" },
  buttons: { gap: 12, marginBottom: 24 },
  link: { minHeight: 44, paddingHorizontal: 18, paddingVertical: 9, alignItems: "center", justifyContent: "center" },
  linkT: { ...typography.label14, color: Theme.text.secondary, textAlign: "center" },
});
