import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { SnackbarProvider } from "../components/Snackbar";
import { SessionProvider } from "../state/session";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { fontAssets } from "../theme/fonts";
import { C } from "../theme/tokens";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <SnackbarProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.white } }}>
          <Stack.Screen name="flyer" options={{ presentation: "modal" }} />
        </Stack>
        </SnackbarProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
