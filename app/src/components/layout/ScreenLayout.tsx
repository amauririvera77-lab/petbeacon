import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../../theme/tokens";

// Layout compartido por el onboarding y los flujos de Report lost / Report a sighting (prototipo):
//   encabezado → contenido (mide lo que ocupa; hace scroll solo si no cabe) → CTA justo debajo.
// El CTA NO se ancla al fondo: va a `margin-top: 32` del contenido, con `padding: 0 24 32` (+ safe area inferior).
export function ScreenLayout({ header, children, cta, contentStyle }: {
  header?: ReactNode; children: ReactNode; cta?: ReactNode; contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.surface.card, paddingTop: insets.top }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {header}
      {/* flexGrow 0 (en RN el ScrollView crece por defecto): el contenido no se estira y el CTA queda pegado debajo. */}
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled" bounces={false}>
        {children}
      </ScrollView>
      {cta ? <View style={{ marginTop: 32, paddingHorizontal: 24, paddingBottom: 32 + insets.bottom }}>{cta}</View> : null}
    </KeyboardAvoidingView>
  );
}
