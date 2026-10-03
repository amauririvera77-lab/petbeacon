import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SnackbarProvider } from "../components/Snackbar";
import { HomePrefsProvider } from "../state/homePrefs";
import { OnboardingPreviewProvider } from "../state/onboardingPreview";
import { SessionProvider } from "../state/session";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { fontAssets } from "../theme/fonts";
import { Theme } from "../theme/tokens";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      {/* Herramienta de diseño ("Replay onboarding", Profile → Design tools): quitar junto con esa sección antes de publicar. */}
      <OnboardingPreviewProvider>
      <SessionProvider>
        <HomePrefsProvider>
        <SnackbarProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Theme.surface.card } }}>
          <Stack.Screen name="flyer" options={{ presentation: "modal" }} />
        </Stack>
        </SnackbarProvider>
        </HomePrefsProvider>
      </SessionProvider>
      </OnboardingPreviewProvider>
    </SafeAreaProvider>
  );
}
