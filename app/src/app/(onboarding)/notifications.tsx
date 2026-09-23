// 4 · Notifications priming
import * as Notifications from "expo-notifications";
import { BellRing } from "lucide-react-native";
import { router } from "expo-router";
import { View } from "react-native";
import { Heading, OnboardingScreen, Sub } from "../../components/Screen";
import { Primary } from "../../components/Primary";
import { useSession } from "../../state/session";
import { C } from "../../theme/tokens";
import { finishOnboarding } from "../../lib/onboarding";
import { styles } from "./location";

export default function NotificationsPriming() {
  const s = useSession();
  const enable = async () => {
    try { await Notifications.requestPermissionsAsync(); } catch {}
    router.push("/done");
  };
  return (
    <OnboardingScreen onSkip={() => finishOnboarding(s)} footer={<Primary label="Enable notifications" onPress={enable} />}>
      <View style={styles.center}>
        <View style={styles.circle}><BellRing size={36} color={C.teal} /></View>
        <Heading>Never miss a match</Heading>
        <View style={{ height: 8 }} />
        <Sub>We'll alert you if there's a sighting near you or a match for your pet.</Sub>
      </View>
    </OnboardingScreen>
  );
}
