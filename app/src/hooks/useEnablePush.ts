import * as Notifications from "expo-notifications";
import { Alert, Linking } from "react-native";
import { ensureAccount } from "../lib/account";
import { registerPush } from "../lib/push";
import { supabase } from "../lib/supabase";
import { useSession } from "../state/session";
import { useNotificationPermission } from "./useNotificationPermission";

async function saveProfilePref(patch: { push_notifications_enabled?: boolean; email_notifications_enabled?: boolean }) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.from("profiles").update(patch).eq("id", data.session.user.id);
  if (error) console.warn("saveProfilePref:", error.message);
}
export { saveProfilePref };

// Activar/desactivar las notificaciones push: permiso del sistema → sesión y perfil → token → preferencia.
// Lo usan el toggle de Profile y la tarjeta de Home, para que haya un único comportamiento.
export function useEnablePush() {
  const { name, city, alertRadiusMi, home, pushEnabled, update } = useSession();
  const { state: perm, refresh } = useNotificationPermission();

  const disable = () => {
    update({ pushEnabled: false });
    saveProfilePref({ push_notifications_enabled: false });
  };

  const enable = async () => {
    let p = await Notifications.getPermissionsAsync();
    if (!p.granted && p.canAskAgain) p = await Notifications.requestPermissionsAsync();
    await refresh();
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

  return { perm, on: pushEnabled && perm === "granted", enable, disable };
}
