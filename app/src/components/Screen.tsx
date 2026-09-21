import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, font } from "../theme/tokens";

// Contenedor de pantalla de onboarding: safe area, "Skip" opcional, CTA fijo abajo.
export function OnboardingScreen({
  children, footer, onSkip,
}: { children: ReactNode; footer?: ReactNode; onSkip?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.top}>
        {onSkip ? (
          <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={8} style={styles.skip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

export function Heading({ children }: { children: ReactNode }) {
  return <Text style={styles.h1} accessibilityRole="header">{children}</Text>;
}
export function Sub({ children }: { children: ReactNode }) {
  return <Text style={styles.sub}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  top: { height: 48, alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 24 },
  skip: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  skipText: { fontFamily: font.bodySemi, fontSize: 15, color: C.slate500 },
  body: { flex: 1, paddingHorizontal: 24 },
  footer: { paddingHorizontal: 24, gap: 8 },
  h1: { fontFamily: font.displayMedium, fontSize: 26, lineHeight: 31, letterSpacing: -0.26, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22, color: C.slate700 },
});
