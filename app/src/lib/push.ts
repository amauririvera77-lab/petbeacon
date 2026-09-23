import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import type { LatLng } from "./geo";
import { supabase } from "./supabase";

// Cómo se muestran las notificaciones con la app abierta (SDK 57: banner + lista, sin sonido ni badge).
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const ewkt = (c: LatLng) => `SRID=4326;POINT(${c.lng} ${c.lat})`;

// Guarda en el perfil el token de Expo Push y la ubicación base (para alertas de Lost cercanos).
// Solo si el usuario ya concedió el permiso (el onboarding lo pide); nunca lo pide por sorpresa.
export async function registerPush(uid: string, home: LatLng | null): Promise<string | null> {
  if (!supabase) return null;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return null;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return null;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const patch: { push_token: string; home?: string } = { push_token: token };
    if (home) patch.home = ewkt(home);
    const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
    if (error) { console.warn("registerPush:", error.message); return null; }
    return token;
  } catch (e) {
    console.warn("registerPush failed:", e instanceof Error ? e.message : e);
    return null;
  }
}
