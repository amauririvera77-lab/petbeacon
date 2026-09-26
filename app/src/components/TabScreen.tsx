import { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "./OfflineBanner";
import { ScreenTitle } from "./ScreenTitle";
import { C, font } from "../theme/tokens";

export function TabScreen({ title, subtitle, children, scroll = true, footer }: { title: string; subtitle?: string; children?: ReactNode; scroll?: boolean; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top }}><OfflineBanner /></View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.c}>
          <ScreenTitle title={title} subtitle={subtitle} />
          {children}
        </ScrollView>
      ) : (
        // Modo sin scroll (mapa): cabecera fija y el contenido ocupa el resto de la pantalla.
        <>
          <View style={styles.fixedHead}>
            <ScreenTitle title={title} subtitle={subtitle} />
          </View>
          {children}
        </>
      )}
      {footer}
    </View>
  );
}
export function Placeholder({ text }: { text: string }) {
  return <View style={styles.ph}><Text style={styles.phT}>{text}</Text></View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  c: { padding: 16, paddingTop: 24, paddingBottom: 200, gap: 8 },
  fixedHead: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 8 },
  h: { fontFamily: font.headBold, fontSize: 28, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 15, color: C.slate700 },
  ph: { marginTop: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: C.border2, backgroundColor: C.surface },
  phT: { fontFamily: font.body, fontSize: 14, color: C.slate500 },
});
