import { Bell, Eye, Plus } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { C, FAB_SIZE, font, radius } from "../theme/tokens";

// FAB fijo, esquina inferior derecha (zona de alcance del pulgar), 73px. No mover ni cambiar tamaño.
export function Fab({ bottom }: { bottom: number }) {
  const [open, setOpen] = useState(false);
  const go = (path: "/report/lost" | "/report/sighted") => { setOpen(false); router.push(path); };
  return (
    <>
      {open ? <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityLabel="Close menu" /> : null}
      <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
        {open ? (
          <View style={styles.menu}>
            <Pressable accessibilityRole="button" style={[styles.item, { backgroundColor: C.sos }]} onPress={() => go("/report/lost")}>
              <Bell size={20} color={C.white} /><Text style={styles.itemT}>Report lost pet</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={[styles.item, { backgroundColor: C.warn }]} onPress={() => go("/report/sighted")}>
              <Eye size={20} color={C.white} /><Text style={styles.itemT}>Report a sighting</Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? "Close report menu" : "New report"}
          onPress={() => setOpen((o) => !o)}
          style={[styles.fab, open && { transform: [{ rotate: "45deg" }] }]}
        >
          <Plus size={32} color={C.white} />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", right: 16, alignItems: "flex-end", gap: 12 },
  fab: {
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, backgroundColor: C.teal,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  menu: { gap: 10, alignItems: "flex-end" },
  item: { flexDirection: "row", alignItems: "center", gap: 10, height: 52, paddingHorizontal: 20, borderRadius: radius.pill },
  itemT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
});
