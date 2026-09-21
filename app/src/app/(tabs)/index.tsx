import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { C, font, radius } from "../../theme/tokens";

// List (default) y Map con igual jerarquía. Contenido real: Fases 3 (feed) y 4 (Mapbox).
export default function Home() {
  const [view, setView] = useState<"list" | "map">("list");
  return (
    <TabScreen title="Home">
      <View style={styles.seg} accessibilityRole="tablist">
        {(["list", "map"] as const).map((v) => (
          <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: view === v }} onPress={() => setView(v)}
            style={[styles.segItem, view === v && styles.segOn]}>
            <Text style={[styles.segT, view === v && { color: C.white }]}>{v === "list" ? "List" : "Map"}</Text>
          </Pressable>
        ))}
      </View>
      <Placeholder text={view === "list" ? "Feed by priority — Phase 3." : "Mapbox map with clustering — Phase 4."} />
    </TabScreen>
  );
}
const styles = StyleSheet.create({
  seg: { flexDirection: "row", backgroundColor: C.border, borderRadius: radius.pill, padding: 3, marginTop: 8, alignSelf: "flex-start" },
  segItem: { minHeight: 40, minWidth: 80, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  segOn: { backgroundColor: C.teal },
  segT: { fontFamily: font.bodyBold, fontSize: 14, color: C.slate700 },
});
