// 5 · Done — con intención lost/seen abre el flujo de Report, no el feed vacío. Círculo con check ARRIBA del título.
import { Text } from "react-native";
import { Cta } from "../../components/Cta";
import { OnboardingScreen } from "../../components/Screen";
import { SuccessBlock, successText } from "../../components/layout/Success";
import { useSession } from "../../state/session";
import { finishOnboarding } from "../../lib/onboarding";

export default function Done() {
  const s = useSession();
  const subtitle =
    s.intent === "lost" ? "We'll open your lost pet report next."
    : s.intent === "seen" ? "We'll open a sighting report next."
    : s.intent === "register" ? "We'll open your pet's profile next."
    : "Your neighborhood feed is ready.";
  return (
    <OnboardingScreen cta={<Cta label="Go to Home" onPress={() => finishOnboarding(s)} />}>
      <SuccessBlock title="You're all set">
        <Text style={successText.p}>{subtitle}</Text>
      </SuccessBlock>
    </OnboardingScreen>
  );
}
