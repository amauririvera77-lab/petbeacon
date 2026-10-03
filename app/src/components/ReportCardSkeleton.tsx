import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Theme, radius } from "../theme/tokens";

// Marcador de carga con la forma de ReportCard (fase 6.4): foto + dos líneas + columna derecha. Pulsa suavemente.
export function ReportCardSkeleton() {
  const o = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.55, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [o]);
  return (
    <Animated.View style={[styles.card, { opacity: o }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.photo} />
      <View style={styles.center}>
        <View style={[styles.line, { width: "55%", height: 16 }]} />
        <View style={[styles.line, { width: "35%", height: 20, borderRadius: radius.pill }]} />
        <View style={[styles.line, { width: "75%" }]} />
      </View>
      <View style={styles.right}>
        <View style={[styles.line, { width: 44 }]} />
        <View style={[styles.line, { width: 36 }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card },
  photo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: Theme.border.default },
  center: { flex: 1, gap: 8 },
  right: { alignItems: "flex-end", gap: 8 },
  line: { height: 12, borderRadius: 6, backgroundColor: Theme.border.default },
});
