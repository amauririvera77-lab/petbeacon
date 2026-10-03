import { ReactNode } from "react";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "./OfflineBanner";
import { ScreenTitle } from "./ScreenTitle";
import { FAB_CLEARANCE, Theme } from "../theme/tokens";
import { typography } from "../theme/typography";

// `onScroll`: mismo comportamiento del FAB que el resto de la app (hooks/useFabScroll.ts) — se pasa tal cual a la ScrollView.
export function TabScreen({ title, subtitle, children, scroll = true, footer, onScroll }: {
  title: string; subtitle?: string; children?: ReactNode; scroll?: boolean; footer?: ReactNode;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top }}><OfflineBanner /></View>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.c} onScroll={onScroll} scrollEventThrottle={onScroll ? 16 : undefined}>
          <ScreenTitle title={title} subtitle={subtitle} variant="display" />
          {children}
        </ScrollView>
      ) : (
        // Modo sin scroll (mapa): cabecera fija y el contenido ocupa el resto de la pantalla.
        <>
          <View style={styles.fixedHead}>
            <ScreenTitle title={title} subtitle={subtitle} variant="display" />
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
  root: { flex: 1, backgroundColor: Theme.surface.card },
  c: { padding: 16, paddingTop: 24, paddingBottom: FAB_CLEARANCE, gap: 8 },
  fixedHead: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 8 },
  ph: { marginTop: 16, padding: 20, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: Theme.border.strong, backgroundColor: Theme.surface.page },
  phT: { ...typography.body14, color: Theme.text.muted },
});
