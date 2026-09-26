import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font } from "../theme/tokens";

// Fin del feed (D.5): dice hasta dónde llega la lista y, si el radio aún puede crecer, ofrece ampliarlo (abre la hoja de filtros, donde
// vive el selector de radio). En el radio máximo (10 mi) no hay enlace.
export function EndOfFeed({ radiusMi, maxRadiusMi = 10, onExpand }: { radiusMi: number; maxRadiusMi?: number; onExpand: () => void }) {
  return (
    <View style={styles.box}>
      <Text style={styles.t}>You've seen all reports within {radiusMi} mi</Text>
      {radiusMi < maxRadiusMi ? (
        <Pressable accessibilityRole="button" onPress={onExpand} style={styles.link}><Text style={styles.linkT}>Expand radius</Text></Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", paddingTop: 8 },
  t: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate500, textAlign: "center" },
  link: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 12 },
  linkT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink, textDecorationLine: "underline" },
});
