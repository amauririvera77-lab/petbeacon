// 3 · Location priming (soft-ask antes del permiso del sistema)
import * as Location from "expo-location";
import { MapPin } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Cta } from "../../components/Cta";
import { OnboardingScreen, PrimingBlock } from "../../components/Screen";
import { useOnboardingPreview } from "../../state/onboardingPreview";
import { useSession } from "../../state/session";
import { C } from "../../theme/tokens";
import { finishOnboarding } from "../../lib/onboarding";

export default function LocationPriming() {
  const s = useSession();
  const preview = useOnboardingPreview();
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return fallback("We couldn't read your location automatically.");
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      s.update({ home: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      router.push("/notifications");
    } catch {
      fallback("We couldn't read your location automatically.");
    } finally {
      setBusy(false);
    }
  };
  const fallback = (reason: string) => router.push({ pathname: "/location-manual", params: { reason } });

  return (
    <OnboardingScreen onSkip={() => finishOnboarding(s, preview)} cta={<Cta label="Enable location" disabled={busy} onPress={enable} />}>
      <PrimingBlock icon={<MapPin size={36} color={C.teal} />} title="See what's happening nearby">
        We use your location to show alerts and the map for your area.
      </PrimingBlock>
    </OnboardingScreen>
  );
}
