import * as Notifications from "expo-notifications";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { RadiusSlider } from "../../components/RadiusSlider";
import { ToggleRow } from "../../components/ToggleRow";
import { useNotificationPermission } from "../../hooks/useNotificationPermission";
import { ensureAccount } from "../../lib/account";
import { registerPush } from "../../lib/push";
import { supabase } from "../../lib/supabase";
import { useSession } from "../../state/session";
import { C, font, radius } from "../../theme/tokens";

// Guarda una preferencia en el perfil si ya existe sesión (si no, queda solo en el dispositivo hasta crearla).
async function saveProfilePref(patch: { push_notifications_enabled?: boolean; email_notifications_enabled?: boolean }) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.from("profiles").update(patch).eq("id", data.session.user.id);
  if (error) console.warn("saveProfilePref:", error.message);
}

export default function Profile() {
  const { name, city, alertRadiusMi, home, pushEnabled, emailEnabled, update } = useSession();
  const { state: perm, refresh: refreshPerm } = useNotificationPermission();

  const onPush = async (want: boolean) => {
    if (!want) {
      update({ pushEnabled: false });
      saveProfilePref({ push_notifications_enabled: false });
      return;
    }
    let p = await Notifications.getPermissionsAsync();
    if (!p.granted && p.canAskAgain) p = await Notifications.requestPermissionsAsync();
    await refreshPerm();
    if (!p.granted) {
      Alert.alert("Notifications are turned off", "Allow notifications for Expo Go in your iPhone's Settings to get match and nearby alerts.", [
        { text: "Not now", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    update({ pushEnabled: true });
    try {
      // Crea la sesión y el perfil si aún no existen (p. ej. quien nunca publicó un reporte) para poder guardar el token.
      const uid = await ensureAccount({ name, city, alertRadiusMi, home });
      const token = await registerPush(uid, home);
      await saveProfilePref({ push_notifications_enabled: true });
      if (!token) Alert.alert("Couldn't finish setting up notifications", "Your device didn't return a push token. Please try again in a moment.");
    } catch (e) {
      Alert.alert("Couldn't turn on notifications", e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const pushOn = pushEnabled && perm === "granted";

  return (
    <TabScreen title={name || "Profile"} subtitle={city}>
      <View style={styles.section}>
        <Text style={styles.h}>Alert radius</Text>
        <Text style={styles.s}>Notify me about activity within</Text>
        <View style={{ marginTop: 12 }}>
          <RadiusSlider value={alertRadiusMi} onChange={(alertRadiusMi) => update({ alertRadiusMi })} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.h}>Notifications</Text>
        <View style={{ gap: 12, marginTop: 8 }}>
          <ToggleRow title="Push alerts" subtitle="Proximity alerts and match updates" value={pushOn} onChange={onPush}
            note={perm === "denied" ? "Notifications are off for Expo Go in iPhone Settings." : undefined} />
          <ToggleRow title="Email summaries" subtitle="Weekly digest of nearby activity" value={emailEnabled}
            onChange={(v) => { update({ emailEnabled: v }); saveProfilePref({ email_notifications_enabled: v }); }} />
        </View>
      </View>

      <Placeholder text="Registered pets, Help and FAQ, Log out — Phase 7." />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, gap: 2 },
  h: { fontFamily: font.head, fontSize: 16, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500 },
});
