import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Theme, MIN_HIT } from "../theme/tokens";
import { typography } from "../theme/typography";

// Fin del feed (D.5): dice hasta dónde llega la lista y, si el radio aún puede crecer, ofrece ampliarlo (abre la hoja de filtros, donde
// vive el selector de radio). En el radio máximo (10 mi) no hay enlace.
export function EndOfFeed({ radiusMi, maxRadiusMi = 10, onExpand }: { radiusMi: number; maxRadiusMi?: number; onExpand: () => void }) {
  return (
    <View style={styles.box}>
      <AppText style={styles.t}>You've seen all reports within {radiusMi} mi</AppText>
      {radiusMi < maxRadiusMi ? (
        <Pressable accessibilityRole="button" onPress={onExpand} style={styles.link}><AppText style={styles.linkT}>Expand radius</AppText></Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", paddingTop: 8 },
  t: { ...typography.label13, color: Theme.text.muted, textAlign: "center" },
  link: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 12 },
  linkT: { ...typography.label14, color: Theme.text.primary, textDecorationLine: "underline" },
});
