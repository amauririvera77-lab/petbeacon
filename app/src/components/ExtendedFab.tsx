import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { useFab } from "../state/fab";
import { Theme, FAB_SIZE } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";
import { ReportSheet } from "./ReportSheet";

const EXPANDED_W = 172;

// FAB con intención explícita (fase 4.1): botón extendido "+ Report" que abre un bottom sheet con los dos flujos opuestos
// ("I lost my pet" / "I saw a pet"). Contraído es el círculo de 73 px (CLAUDE.md §7); la Home lo contrae al bajar por el feed y
// lo expande al subir. Sigue anclado abajo a la derecha (zona del pulgar).
export function ExtendedFab({ bottom }: { bottom: number }) {
  const { collapsed, hidden } = useFab();
  const [open, setOpen] = useState(false);
  const t = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: collapsed ? 0 : 1, duration: 180, useNativeDriver: false }).start();
  }, [collapsed, t]);

  const width = t.interpolate({ inputRange: [0, 1], outputRange: [FAB_SIZE, EXPANDED_W] });
  return (
    <>
      {hidden ? null : (
        <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Report" accessibilityHint="Opens options to report a lost or a seen pet" onPress={() => setOpen(true)}>
            <Animated.View style={[styles.fab, { width }]}>
              <View style={styles.iconSlot}><Plus size={32} color={Theme.text.onAccent} /></View>
              <Animated.Text numberOfLines={1} style={[styles.label, { opacity: t }]}>Report</Animated.Text>
            </Animated.View>
          </Pressable>
        </View>
      )}
      <ReportSheet visible={open} onClose={() => setOpen(false)} onPick={(kind) => router.push(kind === "lost" ? "/report/lost" : "/report/sighted")} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", right: 16, alignItems: "flex-end" },
  fab: {
    height: FAB_SIZE, borderRadius: FAB_SIZE / 2, backgroundColor: Theme.brand.primary, flexDirection: "row", alignItems: "center", overflow: "hidden",
    ...elevation[2],
  },
  iconSlot: { width: FAB_SIZE, height: FAB_SIZE, alignItems: "center", justifyContent: "center" },
  label: { ...typography.button16, color: Theme.text.onAccent, marginLeft: -6 },
});
