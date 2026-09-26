import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Estado vacío o de error con una acción concreta (fase 6): "Expand to 10 mi", "Reset filters", "Try again".
export function EmptyState({ title, body, actionLabel, onAction, style }: { title: string; body?: string; actionLabel?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.box, style]}>
      <Text style={styles.t}>{title}</Text>
      {body ? <Text style={styles.b}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}>
          <Text style={styles.btnT}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", gap: 8, padding: 24, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: C.border2, backgroundColor: C.white },
  t: { fontFamily: font.head, fontSize: 16, color: C.ink, textAlign: "center" },
  b: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 20, color: C.slate700, textAlign: "center" },
  btn: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 20, marginTop: 4, borderRadius: radius.pill, backgroundColor: C.ink },
  btnT: { fontFamily: font.bodyBold, fontSize: 14, color: C.white },
});
