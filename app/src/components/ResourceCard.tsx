import { Phone } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ResourceNearby } from "../lib/database.types";
import { CATEGORY_STYLE, resourceIcon } from "../lib/resources";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Tarjeta de Support and care: ícono tintado por categoría, descripción, distancia y botón Contact.
export function ResourceCard({ resource: r, onContact }: { resource: ResourceNearby; onContact: () => void }) {
  const { color, tint } = CATEGORY_STYLE[r.category];
  const Icon = resourceIcon(r);
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: tint }]}><Icon size={22} color={color} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{r.name}</Text>
        <Text style={styles.desc}>{r.description}</Text>
        <View style={styles.foot}>
          <Text style={styles.dist}>{r.distance_mi.toFixed(1)} mi away</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Contact ${r.name}`} onPress={onContact} style={({ pressed }) => [styles.btn, pressed && { backgroundColor: C.ink }]}>
            {({ pressed }) => (<><Phone size={14} color={pressed ? C.white : C.ink} /><Text style={[styles.btnT, pressed && { color: C.white }]}>Contact</Text></>)}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Tarjeta del feed de Home (recurso destacado intercalado): fondo info, como en el prototipo.
export function FeaturedResourceCard({ resource: r, onPress }: { resource: ResourceNearby; onPress: () => void }) {
  const Icon = resourceIcon(r);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.featured}>
      <View style={styles.fIcon}><Icon size={22} color={C.info} /></View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.fKind}>Community resource</Text>
        <Text style={styles.fName}>{r.name}</Text>
        <Text style={styles.fMeta} numberOfLines={2}>{[r.hours, `${r.distance_mi.toFixed(1)} mi away`].filter(Boolean).join(" · ")}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink, marginBottom: 2 },
  desc: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19, color: C.slate700, marginBottom: 12 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  dist: { fontFamily: font.bodyBold, fontSize: 12, color: C.teal },
  btn: { minHeight: MIN_HIT - 4, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white, flexDirection: "row", gap: 6, alignItems: "center" },
  btnT: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  featured: { flexDirection: "row", gap: 14, alignItems: "center", padding: 16, borderRadius: radius.lg, backgroundColor: C.infoTint, borderWidth: 1, borderColor: C.info },
  fIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  fKind: { fontFamily: font.bodyBold, fontSize: 11, color: C.info, textTransform: "uppercase", letterSpacing: 0.5 },
  fName: { fontFamily: font.head, fontSize: 16, color: C.ink },
  fMeta: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
});
