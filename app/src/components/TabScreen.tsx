import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "./OfflineBanner";
import { C, font } from "../theme/tokens";

export function TabScreen({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top }}><OfflineBanner /></View>
      <ScrollView contentContainerStyle={styles.c}>
        <Text style={styles.h} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={styles.s}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </View>
  );
}
export function Placeholder({ text }: { text: string }) {
  return <View style={styles.ph}><Text style={styles.phT}>{text}</Text></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  c: { padding: 16, paddingBottom: 200, gap: 8 },
  h: { fontFamily: font.headBold, fontSize: 28, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 15, color: C.slate700 },
  ph: { marginTop: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: C.border2, backgroundColor: C.surface },
  phT: { fontFamily: font.body, fontSize: 14, color: C.slate500 },
});
