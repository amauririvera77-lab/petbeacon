// 2 · Signup — solo nombre y ciudad. El headline es texto fijo: NO interpola lo que el usuario escribe.
import { router } from "expo-router";
import { View } from "react-native";
import { Cta } from "../../components/Cta";
import { OnboardingScreen, ob } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useSession } from "../../state/session";
import { finishOnboarding } from "../../lib/onboarding";
import { Text } from "react-native";

export default function Signup() {
  const s = useSession();
  return (
    <OnboardingScreen onSkip={() => finishOnboarding(s)} cta={<Cta label="Continue" disabled={!s.name.trim()} onPress={() => router.push("/location")} />}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
        <Text style={[ob.h1, { marginBottom: 32 }]} accessibilityRole="header">{s.intent === "lost" ? "Let's get you set up to find your pet" : "Let's get you set up"}</Text>
        <View style={{ gap: 24 }}>
          <TextField variant="ds" label="Your name" placeholder="Jordan Rivera" value={s.name} onChangeText={(name) => s.update({ name })} autoComplete="name" />
          <TextField variant="ds" label="City" placeholder="White Plains, NY" value={s.city} onChangeText={(city) => s.update({ city })} />
        </View>
      </View>
    </OnboardingScreen>
  );
}
