import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

// Estado del permiso de ubicación, releído al volver de Ajustes (fase 6.1). "unknown" hasta la primera lectura.
export function useLocationPermission() {
  const [status, setStatus] = useState<"unknown" | "granted" | "denied" | "undetermined">("unknown");
  const recheck = useCallback(async () => {
    try {
      const p = await Location.getForegroundPermissionsAsync();
      setStatus(p.granted ? "granted" : p.canAskAgain ? "undetermined" : "denied");
    } catch { setStatus("unknown"); }
  }, []);
  useEffect(() => {
    recheck();
    const sub = AppState.addEventListener("change", (s) => { if (s === "active") recheck(); });
    return () => sub.remove();
  }, [recheck]);
  return { status, recheck };
}
