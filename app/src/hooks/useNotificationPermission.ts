import * as Notifications from "expo-notifications";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export type PermState = "granted" | "denied" | "undetermined";

// Estado del permiso del sistema; se relee al enfocar la pantalla (el usuario puede cambiarlo en Ajustes de iOS).
export function useNotificationPermission() {
  const [state, setState] = useState<PermState>("undetermined");
  const refresh = useCallback(async () => {
    const p = await Notifications.getPermissionsAsync();
    setState(p.granted ? "granted" : p.canAskAgain ? "undetermined" : "denied");
  }, []);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  return { state, refresh };
}
