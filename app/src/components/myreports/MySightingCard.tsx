import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReportNearby } from "../../lib/database.types";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";
import { ReportCard } from "../ReportCard";

// Un avistamiento propio: la MISMA tarjeta del feed (título por raza/especie, badge junto al título, distancia y tiempo a la derecha) y sus tres acciones.
export function MySightingCard({ report, onOpen, onEdit, onStillThere, onResolve }: {
  report: ReportNearby; onOpen: () => void; onEdit: () => void; onStillThere: () => void; onResolve: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <ReportCard report={report} mine onPress={onOpen} />
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onEdit} style={styles.btn}><Text style={styles.btnT}>Edit</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onStillThere} style={styles.btn}><Text style={styles.btnT}>Still there</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onResolve} style={[styles.btn, { flexGrow: 1.6 }]}><Text style={styles.btnT}>Mark as resolved</Text></Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { gap: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: { flexGrow: 1, minHeight: MIN_HIT, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white },
  btnT: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
});
