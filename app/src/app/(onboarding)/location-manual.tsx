// 3b · Fallback manual — se abre si el GPS falla o se rechaza. Label genérico "City or ZIP code".
import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { AppText } from "../../components/AppText";
import { Cta } from "../../components/Cta";
import { OnboardingScreen, ob } from "../../components/Screen";
import { TextField } from "../../components/TextField";
import { useOnboardingPreview } from "../../state/onboardingPreview";
import { useSession } from "../../state/session";
import { finishOnboarding } from "../../lib/onboarding";

export default function LocationManual() {
  const s = useSession();
  const preview = useOnboardingPreview();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  return (
    <OnboardingScreen onSkip={() => finishOnboarding(s, preview)} cta={<Cta label="Continue" disabled={!s.city.trim()} onPress={() => router.push("/notifications")} />}>
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}>
        <AppText role="title" style={[ob.h1, { marginBottom: 8 }]} accessibilityRole="header">Add your location manually</AppText>
        <AppText style={[ob.p, { marginBottom: 32 }]}>{reason || "We couldn't read your location automatically."}</AppText>
        <TextField variant="ds" label="City or ZIP code" placeholder="White Plains, NY" helper="Use this if your location was detected incorrectly."
          value={s.city} onChangeText={(city) => s.update({ city })} />
      </View>
    </OnboardingScreen>
  );
}
