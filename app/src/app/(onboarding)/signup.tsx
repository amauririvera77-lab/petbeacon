// 2 · Signup — solo nombre y ciudad. El headline es texto fijo: NO interpola lo que el usuario escribe.
import { router } from "expo-router";
import { View } from "react-native";
import { Heading, OnboardingScreen } from "../../components/Screen";
import { Primary } from "../../components/Primary";
import { TextField } from "../../components/TextField";
import { useSession } from "../../state/session";
import { finishOnboarding } from "../../lib/onboarding";

export default function Signup() {
  const s = useSession();
  return (
    <OnboardingScreen
      onSkip={() => finishOnboarding(s)}
      footer={<Primary label="Continue" disabled={!s.name.trim()} onPress={() => router.push("/location")} />}
    >
      <Heading>{s.intent === "lost" ? "Let's get you set up to find your pet" : "Let's get you set up"}</Heading>
      <View style={{ gap: 24, marginTop: 32 }}>
        <TextField label="Your name" placeholder="Jordan Rivera" value={s.name} onChangeText={(name) => s.update({ name })} autoComplete="name" />
        <TextField label="City" placeholder="White Plains, NY" value={s.city} onChangeText={(city) => s.update({ city })} />
      </View>
    </OnboardingScreen>
  );
}
