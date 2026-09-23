import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { registerPush } from "../lib/push";
import { useSession } from "../state/session";
import { useAuthUser } from "./useAuthUser";

// Registra el token cuando hay sesión y permiso, y lleva a Home al tocar una notificación
// (el banner de match y el feed ya cargan su dato al enfocar Home).
export function usePushNotifications() {
  const uid = useAuthUser();
  const { home } = useSession();

  useEffect(() => {
    if (uid) registerPush(uid, home);
  }, [uid, home]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => router.navigate("/(tabs)"));
    return () => sub.remove();
  }, []);
}
