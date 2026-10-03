import { router, type Tabs } from "expo-router";
import { ClipboardList, HeartHandshake, House, Plus, User, type LucideIcon } from "lucide-react-native";
import { useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tabBarBottomDistance } from "../hooks/useTabBarClearance";
import { REPORT_BUTTON, TAB_BAR_PADDING, TAB_BAR_SIDE_MARGIN, Theme, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { ReportSheet } from "./ReportSheet";
import { TabBarButton } from "./TabBarButton";

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

const ICONS: Record<string, LucideIcon> = { index: House, reports: ClipboardList, support: HeartHandshake, profile: User };

// Tab bar flotante (v1.1, Figma "TabBar — Floating"): una sola barra sobre el contenido con la acción Report integrada en
// el centro, en vez de tab bar + FAB. Cinco huecos en este orden: Home, My Reports, Report, Support, Profile. Report no es una
// ruta — abre la misma hoja que abría el FAB (ReportSheet: "I lost my pet" / "I saw a pet") y de ahí el mismo flujo.
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [reportOpen, setReportOpen] = useState(false);
  const bottom = tabBarBottomDistance(insets.bottom);

  const tabs = state.routes.map((route, i) => {
    const focused = state.index === i;
    const onPress = () => {
      const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
    };
    const onLongPress = () => navigation.emit({ type: "tabLongPress", target: route.key });
    return (
      <TabBarButton key={route.key} Icon={ICONS[route.name] ?? House} label={descriptors[route.key].options.title ?? route.name}
        aria-selected={focused} onPress={onPress} onLongPress={onLongPress} testID={descriptors[route.key].options.tabBarButtonTestID} />
    );
  });
  // Report va entre la 2.ª y la 3.ª pestaña (Home, My Reports | Report | Support, Profile).
  const half = Math.ceil(tabs.length / 2);

  return (
    <>
      <View style={[styles.bar, { bottom }]} accessibilityRole="tablist">
        {tabs.slice(0, half)}
        <View style={styles.reportSlot}>
          <Pressable
            accessibilityRole="button" accessibilityLabel="Report a pet" accessibilityHint="Report a lost pet or a sighting"
            onPress={() => setReportOpen(true)}
            style={({ pressed }) => [styles.report, pressed && { opacity: 0.85 }]}
          >
            <Plus size={24} color={Theme.text.onAccent} />
          </Pressable>
        </View>
        {tabs.slice(half)}
      </View>
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} onPick={(kind) => router.push(kind === "lost" ? "/report/lost" : "/report/sighted")} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute", left: TAB_BAR_SIDE_MARGIN, right: TAB_BAR_SIDE_MARGIN, flexDirection: "row", alignItems: "center", padding: TAB_BAR_PADDING,
    backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default, borderRadius: radius.xl, ...elevation[2],
  },
  // Hueco central de ancho fijo (56 de botón + 4 de margen a cada lado); las cuatro pestañas (flex: 1) se reparten el resto.
  reportSlot: { width: REPORT_BUTTON.slot, alignItems: "center", justifyContent: "center" },
  report: { width: REPORT_BUTTON.width, height: REPORT_BUTTON.height, borderRadius: radius.pill, backgroundColor: Theme.brand.primary, alignItems: "center", justifyContent: "center" },
});
