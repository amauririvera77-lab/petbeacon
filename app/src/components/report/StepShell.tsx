import { ChevronLeft, X } from "lucide-react-native";
import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../Button";
import { Primary } from "../Primary";
import { C, MIN_HIT, font } from "../../theme/tokens";

type Props = {
  title: string;
  subtitle?: string;
  step?: number; // 1-based; sin step no muestra progreso (pantallas de confirmación)
  total?: number;
  onBack?: () => void;
  onClose: () => void;
  children: ReactNode;
  cta: { label: string; onPress: () => void; disabled?: boolean; tone?: "lost" | "sighted" | "neutral" };
  secondary?: { label: string; onPress: () => void };
};

export function StepShell({ title, subtitle, step, total, onBack, onClose, children, cta, secondary }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.icon}><ChevronLeft size={26} color={C.ink} /></Pressable>
        ) : <View style={styles.icon} />}
        {step && total ? (
          <View style={styles.dots} accessibilityLabel={`Step ${step} of ${total}`}>
            {Array.from({ length: total }, (_, i) => <View key={i} style={[styles.dot, i < step && { backgroundColor: C.ink }]} />)}
          </View>
        ) : <View />}
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.icon}><X size={24} color={C.ink} /></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.h} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.s}>{subtitle}</Text> : null}
        <View style={{ marginTop: 24, gap: 20 }}>{children}</View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {cta.tone === "lost" ? <Button label={cta.label} variant="primaryLost" onPress={cta.onPress} disabled={cta.disabled} />
          : cta.tone === "sighted" ? <Button label={cta.label} variant="primarySighted" onPress={cta.onPress} disabled={cta.disabled} />
          : <Primary label={cta.label} onPress={cta.onPress} disabled={cta.disabled} />}
        {secondary ? (
          <Pressable accessibilityRole="button" onPress={secondary.onPress} style={styles.link}><Text style={styles.linkT}>{secondary.label}</Text></Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 8 },
  icon: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 28, height: 4, borderRadius: 2, backgroundColor: C.border },
  body: { padding: 24, paddingBottom: 32 },
  h: { fontFamily: font.displayMedium, fontSize: 26, lineHeight: 31, letterSpacing: -0.26, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22, color: C.slate700, marginTop: 8 },
  footer: { paddingHorizontal: 24, paddingTop: 12, gap: 4, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.white },
  link: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  linkT: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700, textAlign: "center" },
});
