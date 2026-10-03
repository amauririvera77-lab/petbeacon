import { StyleSheet, Text, View } from "react-native";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Se muestra mientras app/.env no tenga las credenciales de Supabase (Fase 3, pendiente de cuenta).
export function SetupNotice({ what = "Supabase", vars = "EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY" }: { what?: string; vars?: string }) {
  return (
    <View style={styles.box}>
      <Text style={styles.t}>{what} isn't connected yet</Text>
      <Text style={styles.s}>Add {vars} to app/.env, then restart the dev server.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  box: { marginTop: 16, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: Theme.border.strong, backgroundColor: Theme.surface.page, gap: 4 },
  t: { ...typography.label14, color: Theme.text.primary },
  s: { ...typography.bodySm13, color: Theme.text.muted },
});
