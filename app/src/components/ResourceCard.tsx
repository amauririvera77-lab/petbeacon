import { ChevronRight, HeartHandshake, Phone } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ResourceNearby } from "../lib/database.types";
import { CATEGORY_STYLE, resourceIcon } from "../lib/resources";
import { eventWhen } from "../lib/time";
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

// Tarjeta de recurso comunitario del feed (fase 3.4): variante NEUTRAL (la misma tarjeta blanca con borde que usan los reportes) para
// que no compita con los reportes urgentes ni se lea como publicidad. Etiqueta superior "Community resource" + fecha concreta.
export function CommunityResourceCard({ resource: r, onPress }: { resource: ResourceNearby; onPress: () => void }) {
  const when = eventWhen(r.event_date, r.hours);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Community resource: ${r.name}`} onPress={onPress} style={({ pressed }) => [styles.neutral, pressed && { opacity: 0.9 }]}>
      <View style={styles.nIcon}><HeartHandshake size={22} color={C.slate700} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.nKind}>Community resource</Text>
        <Text style={styles.nName} numberOfLines={2}>{r.name}</Text>
        {when ? <Text style={styles.nWhen}>{when}</Text> : null}
        <Text style={styles.nDist}>{r.distance_mi.toFixed(1)} mi away</Text>
      </View>
      <ChevronRight size={18} color={C.slate500} />
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
  neutral: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  nIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  nKind: { fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: C.slate500 },
  nName: { fontFamily: font.head, fontSize: 16, color: C.ink },
  nWhen: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate700 },
  nDist: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
});
