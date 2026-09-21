// 3 · Location priming (soft-ask antes del permiso del sistema)
import * as Location from "expo-location";
import { MapPin } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Heading, OnboardingScreen, Sub } from "../../components/Screen";
import { Primary } from "../../components/Primary";
import { useSession } from "../../state/session";
import { C } from "../../theme/tokens";
import { finishOnboarding } from "./finish";

export default function LocationPriming() {
  const s = useSession();
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return fallback("We couldn't read your location automatically.");
      await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      router.push("/notifications");
    } catch {
      fallback("We couldn't read your location automatically.");
    } finally {
      setBusy(false);
    }
  };
  const fallback = (reason: string) => router.push({ pathname: "/location-manual", params: { reason } });

  return (
    <OnboardingScreen onSkip={() => finishOnboarding(s)} footer={<Primary label="Enable location" disabled={busy} onPress={enable} />}>
      <View style={styles.center}>
        <View style={styles.circle}><MapPin size={36} color={C.teal} /></View>
        <Heading>See what's happening nearby</Heading>
        <View style={{ height: 8 }} />
        <Sub>We use your location to show alerts and the map for your area.</Sub>
      </View>
    </OnboardingScreen>
  );
}
export const styles = StyleSheet.create({
  center: { alignItems: "center", paddingTop: 40, gap: 0 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 32 },
});
