import { Pressable, StyleSheet, Text } from "react-native";
import { C, font, radius } from "../theme/tokens";

export type ButtonVariant = "primaryLost" | "primarySighted" | "secondary" | "ghost";

const BG: Record<ButtonVariant, string> = {
  primaryLost: C.sos,
  primarySighted: C.warn,
  secondary: C.white,
  ghost: "transparent",
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = "primaryLost", disabled }: Props) {
  const filled = variant === "primaryLost" || variant === "primarySighted";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: disabled ? C.border : BG[variant] },
        variant === "secondary" && styles.outlined,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.label, { color: disabled ? C.slate500 : filled ? C.white : C.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { minHeight: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  outlined: { borderWidth: 1.5, borderColor: C.border2 },
  label: { fontFamily: font.bodyBold, fontSize: 16 },
});
