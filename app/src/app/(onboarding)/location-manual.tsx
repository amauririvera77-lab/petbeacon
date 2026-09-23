// 3b · Fallback manual — se abre si el GPS falla o se rechaza. Label genérico "City or ZIP code".
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { Heading, OnboardingScreen, Sub } from "../../components/Screen";
import { Primary } from "../../components/Primary";
import { TextField } from "../../components/TextField";
import { useSession } from "../../state/session";
import { finishOnboarding } from "../../lib/onboarding";

export default function LocationManual() {
  const s = useSession();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  return (
    <OnboardingScreen
      onSkip={() => finishOnboarding(s)}
      footer={<Primary label="Continue" disabled={!s.city.trim()} onPress={() => router.push("/notifications")} />}
    >
      <Heading>Add your location manually</Heading>
      <View style={{ height: 8 }} />
      <Sub>{reason || "We couldn't read your location automatically."}</Sub>
      <View style={{ marginTop: 32 }}>
        <TextField
          label="City or ZIP code"
          placeholder="White Plains, NY"
          helper="Use this if your location was detected incorrectly."
          value={s.city}
          onChangeText={(city) => s.update({ city })}
        />
      </View>
    </OnboardingScreen>
  );
}
