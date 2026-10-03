import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { MIN_HIT, Theme, radius } from "../theme/tokens";
import { typography, weightOff } from "../theme/typography";

const CAPSULE_W = 56;
const CAPSULE_H = 32;

type Props = {
  Icon: LucideIcon;
  label: string;
  onPress?: ((e: GestureResponderEvent) => void) | null;
  onLongPress?: ((e: GestureResponderEvent) => void) | null;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  "aria-selected"?: boolean;
};

// Botón de tab custom (componente "TabBar" de Figma): la pestaña activa se marca con una cápsula brand.tint detrás
// del ícono, no solo con el color (CLAUDE.md §7 — sin tratamiento especial para Support, todas usan el mismo patrón).
// Ícono y cápsula viven en el mismo contenedor de 56×32 en las 4 pestañas, así quedan alineados aunque cada ícono
// tenga proporciones distintas (antes el de Profile quedaba desalineado al usar tabBarIcon por defecto).
export function TabBarButton({ Icon, label, onPress, onLongPress, testID, style, ...rest }: Props) {
  const focused = !!rest["aria-selected"];
  const reduced = useReducedMotion();
  const t = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(t, { toValue: focused ? 1 : 0, duration: reduced ? 0 : 180, useNativeDriver: true }).start();
  }, [focused, reduced, t]);

  const color = focused ? Theme.brand.primary : Theme.text.muted;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      style={[styles.btn, style]}
    >
      <View style={styles.iconWrap}>
        <Animated.View
          pointerEvents="none"
          style={[styles.capsule, { opacity: t, transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }]}
        />
        <Icon size={24} color={color} />
      </View>
      <Text numberOfLines={1} style={[typography.micro11, { color }, !focused && weightOff.micro11]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // minHeight 44 cubre el requisito de área táctil mínima (56×32 es solo la cápsula visual, más chica que el hit-area real).
  btn: { flex: 1, minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", gap: 2 },
  iconWrap: { width: CAPSULE_W, height: CAPSULE_H, alignItems: "center", justifyContent: "center" },
  capsule: { position: "absolute", width: CAPSULE_W, height: CAPSULE_H, borderRadius: radius.pill, backgroundColor: Theme.brand.tint },
});
