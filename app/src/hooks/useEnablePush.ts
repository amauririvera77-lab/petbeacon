import * as Notifications from "expo-notifications";
import { Alert, Linking } from "react-native";
import { ensureAccount } from "../lib/account";
import { registerPush } from "../lib/push";
import { supabase } from "../lib/supabase";
import { useSession } from "../state/session";
import { useNotificationPermission } from "./useNotificationPermission";

type ProfilePrefs = { push_notifications_enabled?: boolean; nearby_alerts_enabled?: boolean; match_updates_enabled?: boolean; email_notifications_enabled?: boolean };
async function saveProfilePref(patch: ProfilePrefs) {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.from("profiles").update(patch).eq("id", data.session.user.id);
  if (error) console.warn("saveProfilePref:", error.message);
}
export { saveProfilePref };

// Notificaciones push: permiso del sistema → sesión y perfil → token → preferencias. Dos categorías independientes (Profile 3.1):
//   · "Nearby alerts"  (nearbyEnabled): Lost y avistamientos cerca de tu zona de alertas
//   · "Match updates"  (matchEnabled):  cuando alguien pudo haber visto a tu mascota
// `pushEnabled` se mantiene como interruptor general heredado = alguna de las dos activa. Lo usan Profile y la tarjeta de Home.
export function useEnablePush() {
  const { name, city, alertRadiusMi, home, nearbyEnabled, matchEnabled, update } = useSession();
  const { state: perm, refresh } = useNotificationPermission();

  const saveFlags = (nearby: boolean, match: boolean) => {
    update({ nearbyEnabled: nearby, matchEnabled: match, pushEnabled: nearby || match });
    return saveProfilePref({ nearby_alerts_enabled: nearby, match_updates_enabled: match, push_notifications_enabled: nearby || match });
  };

  // Apaga una categoría (sin pedir permisos).
  const disableKind = (kind: "nearby" | "match") => saveFlags(kind === "nearby" ? false : nearbyEnabled, kind === "match" ? false : matchEnabled);
  const disable = () => saveFlags(false, false);

  // Enciende una categoría (o ambas): pide el permiso del sistema si hace falta y registra el token.
  const enable = async (kind: "nearby" | "match" | "both" = "both") => {
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
    const nearby = kind === "match" ? nearbyEnabled : true;
    const match = kind === "nearby" ? matchEnabled : true;
    update({ nearbyEnabled: nearby, matchEnabled: match, pushEnabled: true });
    try {
      // Crea la sesión y el perfil si aún no existen (p. ej. quien nunca publicó un reporte) para poder guardar el token.
      const uid = await ensureAccount({ name, city, alertRadiusMi, home });
      const token = await registerPush(uid, home);
      await saveProfilePref({ nearby_alerts_enabled: nearby, match_updates_enabled: match, push_notifications_enabled: true });
      if (!token) Alert.alert("Couldn't finish setting up notifications", "Your device didn't return a push token. Please try again in a moment.");
    } catch (e) {
      Alert.alert("Couldn't turn on notifications", e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const granted = perm === "granted";
  return { perm, on: (nearbyEnabled || matchEnabled) && granted, nearbyOn: nearbyEnabled && granted, matchOn: matchEnabled && granted, enable, disable, disableKind };
}
