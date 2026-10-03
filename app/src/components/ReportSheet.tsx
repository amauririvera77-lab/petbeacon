import { Eye, Siren } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Modal, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";
import { IntentOption } from "./IntentOption";

const OFFSCREEN = 600;

// Bottom sheet del FAB (fase 4.1): dos opciones grandes y claras. Se cierra tocando fuera o DESLIZANDO hacia abajo.
export function ReportSheet({ visible, onClose, onPick }: { visible: boolean; onClose: () => void; onPick: (kind: "lost" | "sighted") => void }) {
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(OFFSCREEN)).current;
  // El PanResponder se crea una vez: lee el callback vigente desde una ref para no quedarse con uno obsoleto.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) { y.setValue(OFFSCREEN); Animated.timing(y, { toValue: 0, duration: 220, useNativeDriver: true }).start(); }
  }, [visible, y]);

  const close = (after?: () => void) =>
    Animated.timing(y, { toValue: OFFSCREEN, duration: 180, useNativeDriver: true }).start(() => { onCloseRef.current(); after?.(); });
  const closeRef = useRef(close);
  closeRef.current = close;

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => g.dy > 4 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_e, g) => { if (g.dy > 0) y.setValue(g.dy); },
    onPanResponderRelease: (_e, g) => {
      if (g.dy > 100 || g.vy > 0.8) closeRef.current();
      else Animated.spring(y, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  const options = [
    { kind: "lost" as const, title: "I lost my pet", sub: "Alert neighbors and start the search", Icon: Siren, color: Theme.status.lost.bg },
    { kind: "sighted" as const, title: "I saw a pet", sub: "Help a lost pet get back to its owner", Icon: Eye, color: Theme.status.sighted.bg },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => close()}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={() => close()} accessibilityLabel="Close" />
        <Animated.View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY: y }] }]}>
          <View {...pan.panHandlers} style={styles.dragArea}>
            <View style={styles.handle} />
            <AppText style={styles.title} accessibilityRole="header">What would you like to report?</AppText>
          </View>
          <View style={{ gap: 12, paddingHorizontal: 16 }}>
            {options.map(({ kind, title, sub, Icon, color }) => (
              <IntentOption key={kind} title={title} sub={sub} Icon={Icon} color={color} onPress={() => close(() => onPick(kind))} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.scrim(0.5) },
  sheet: { backgroundColor: Theme.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...elevation[3] },
  dragArea: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 16, alignItems: "center", gap: 14 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border.default },
  title: { alignSelf: "flex-start", ...typography.heading18, color: Theme.text.primary },
});
