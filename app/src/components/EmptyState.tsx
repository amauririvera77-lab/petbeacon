import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { AppText } from "./AppText";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Estado vacío o de error con una acción concreta (fase 6): "Expand to 10 mi", "Reset filters", "Try again".
export function EmptyState({ title, body, actionLabel, onAction, style }: { title: string; body?: string; actionLabel?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.box, style]}>
      <AppText style={styles.t}>{title}</AppText>
      {body ? <AppText style={styles.b}>{body}</AppText> : null}
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
          <AppText role="control" style={styles.btnT}>{actionLabel}</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: 8, padding: 24, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: Theme.border.strong, backgroundColor: Theme.surface.card },
  t: { ...typography.heading16, color: Theme.text.primary, textAlign: "center" },
  b: { ...typography.body14, color: Theme.text.secondary, textAlign: "center" },
  btn: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 20, marginTop: 4, borderRadius: radius.pill, backgroundColor: Theme.brand.primary },
  btnT: { ...typography.button14, color: Theme.text.onAccent },
});
