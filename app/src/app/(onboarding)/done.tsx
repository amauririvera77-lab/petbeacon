// 5 · Done — con intención lost/seen abre el flujo de Report, no el feed vacío.
import { Check } from "lucide-react-native";
import { View } from "react-native";
import { Heading, OnboardingScreen, Sub } from "../../components/Screen";
import { Primary } from "../../components/Primary";
import { useSession } from "../../state/session";
import { C } from "../../theme/tokens";
import { finishOnboarding } from "../../lib/onboarding";
import { styles } from "./location";

export default function Done() {
  const s = useSession();
  const subtitle =
    s.intent === "lost" ? "We'll open your lost pet report next."
    : s.intent === "seen" ? "We'll open a sighting report next."
    : "Your neighborhood feed is ready.";
  return (
    <OnboardingScreen footer={<Primary label="Go to Home" onPress={() => finishOnboarding(s)} />}>
      <View style={styles.center}>
        <View style={[styles.circle, { backgroundColor: C.okTint }]}><Check size={36} color={C.ok} /></View>
        <Heading>You're all set</Heading>
        <View style={{ height: 8 }} />
        <Sub>{subtitle}</Sub>
      </View>
    </OnboardingScreen>
  );
}
