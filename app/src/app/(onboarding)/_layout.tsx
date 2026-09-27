import { router, Stack } from "expo-router";
import { X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboardingPreview } from "../../state/onboardingPreview";
import { C, font, radius } from "../../theme/tokens";

// ⚠️ HERRAMIENTA DE DISEÑO — la franja "Preview" (y "Design tools" en Profile) deben quitarse o desactivarse antes de publicar.
// Aparece SOLO mientras la vista previa del onboarding está activa (Profile → Design tools → Replay onboarding) y deja cerrarla desde
// cualquier paso, incluida la primera pantalla (Welcome), que no tiene "Skip". Salir aquí nunca guarda nada: solo apaga la vista previa
// y vuelve a Profile.
export default function OnboardingLayout() {
  const preview = useOnboardingPreview();
  const insets = useSafeAreaInsets();
  const exit = () => { preview.stop(); router.replace("/(tabs)/profile"); };
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      {preview.active ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Exit onboarding preview" onPress={exit} style={[styles.badge, { top: insets.top + 8 }]}>
          <Text style={styles.badgeT}>Preview</Text>
          <X size={14} color={C.white} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: "absolute", left: 12, zIndex: 50, minHeight: 32, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: "rgba(15,23,42,0.85)" },
  badgeT: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: C.white },
});
