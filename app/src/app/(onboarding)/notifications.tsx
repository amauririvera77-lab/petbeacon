// 4 · Notifications priming
import * as Notifications from "expo-notifications";
import { BellRing } from "lucide-react-native";
import { router } from "expo-router";
import { Cta } from "../../components/Cta";
import { OnboardingScreen, PrimingBlock } from "../../components/Screen";
import { useOnboardingPreview } from "../../state/onboardingPreview";
import { useSession } from "../../state/session";
import { Theme } from "../../theme/tokens";
import { finishOnboarding } from "../../lib/onboarding";

export default function NotificationsPriming() {
  const s = useSession();
  const preview = useOnboardingPreview();
  const enable = async () => {
    try { await Notifications.requestPermissionsAsync(); } catch {}
    router.push("/done");
  };
  return (
    <OnboardingScreen onSkip={() => finishOnboarding(s, preview)} cta={<Cta label="Enable notifications" onPress={enable} />}>
      <PrimingBlock icon={<BellRing size={36} color={Theme.brand.primary} />} title="Never miss a match">
        We'll alert you if there's a sighting near you or a match for your pet.
      </PrimingBlock>
    </OnboardingScreen>
  );
}
