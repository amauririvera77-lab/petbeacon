import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { MIN_HIT, Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

export type ButtonVariant = "primary" | "primaryLost" | "primarySighted" | "secondary" | "ghost";
export type ButtonSize = "default" | "compact";

const BG: Record<ButtonVariant, string> = {
  primary: Theme.brand.primary,
  primaryLost: Theme.status.lost.bg,
  primarySighted: Theme.status.sighted.bg,
  secondary: Theme.surface.card,
  ghost: "transparent",
};

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  Icon?: LucideIcon;
  disabled?: boolean;
};

// Único componente de botón secundario de la app (fase de congelación, Fase 1): variant="secondary" es siempre
// surface.card + borde border.strong + texto text.primary — nunca el relleno gris, que queda solo para `disabled`.
// `size="compact"` (Button/14, alto MIN_HIT-4) es para botones embebidos en una tarjeta (p. ej. ResourceCard);
// el tamaño por defecto (Button/16, alto 52) es para botones de pantalla completa.
export function Button({ label, onPress, variant = "primary", size = "default", Icon, disabled }: Props) {
  const filled = variant !== "secondary" && variant !== "ghost";
  const color = disabled ? Theme.text.muted : filled ? Theme.text.onAccent : Theme.text.primary;
  const compact = size === "compact";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.defaultSize,
        { backgroundColor: disabled ? Theme.border.default : BG[variant] },
        variant === "secondary" && styles.outlined,
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      {Icon ? <Icon size={compact ? 14 : 18} color={color} /> : null}
      <Text style={[compact ? styles.labelCompact : styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", gap: 8, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  defaultSize: { minHeight: 52, paddingHorizontal: 20 },
  compact: { minHeight: MIN_HIT - 4, paddingHorizontal: 16 },
  outlined: { borderWidth: 1.5, borderColor: Theme.border.strong },
  label: typography.button16,
  labelCompact: typography.button14,
});
