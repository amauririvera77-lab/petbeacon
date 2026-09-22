import { StyleSheet, Text, View } from "react-native";
import { C, font, radius } from "../theme/tokens";

// Se muestra mientras app/.env no tenga las credenciales de Supabase (Fase 3, pendiente de cuenta).
export function SetupNotice() {
  return (
    <View style={styles.box}>
      <Text style={styles.t}>Supabase isn't connected yet</Text>
      <Text style={styles.s}>Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to app/.env, then reload.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  box: { marginTop: 16, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: C.border2, backgroundColor: C.surface, gap: 4 },
  t: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500 },
});
