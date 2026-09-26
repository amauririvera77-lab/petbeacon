import { CalendarDays, ChevronRight, HeartHandshake } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ResourceNearby } from "../lib/database.types";
import { CATEGORY_STYLE, isSample, resourceAction, resourceIcon, type ResourceActionKind } from "../lib/resources";
import { OpenNow, SampleTag, TagChips } from "./resources/parts";
import { eventLabel } from "../lib/events";
import { useNow } from "../hooks/useNow";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Tarjeta de Support and care: ícono tintado por categoría, nombre, "Sample data" si es ficticio, distancia + "Open now", etiquetas, descripción y la
// acción principal según el tipo de recurso (Contact / Learn more). Con is_sample la acción queda deshabilitada.
export function ResourceCard({ resource: r, onAction }: { resource: ResourceNearby; onAction: (kind: ResourceActionKind) => void }) {
  const { color, tint } = CATEGORY_STYLE[r.category];
  const Icon = resourceIcon(r);
  const now = useNow();
  const action = resourceAction(r, false);
  const sample = isSample(r);
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: tint }]}><Icon size={22} color={color} /></View>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.name}>{r.name}</Text>
        {sample ? <SampleTag /> : null}
        <View style={styles.metaRow}>
          <Text style={styles.dist}>{r.distance_mi.toFixed(1)} mi away</Text>
          <OpenNow r={r} now={now} />
        </View>
        <TagChips r={r} />
        <Text style={styles.desc}>{r.description}</Text>
        <View style={styles.foot}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${action.label}: ${r.name}`} accessibilityState={{ disabled: sample }}
            onPress={() => onAction(action.kind)} style={({ pressed }) => [styles.btn, sample && styles.btnOff, pressed && { backgroundColor: C.ink }]}>
            {({ pressed }) => (<><action.Icon size={14} color={sample ? C.slate500 : pressed ? C.white : C.ink} /><Text style={[styles.btnT, sample && { color: C.slate500 }, pressed && { color: C.white }]}>{action.label}</Text></>)}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Evento vigente en Support and care: va SIEMPRE arriba de la lista y con otro tratamiento (fondo y borde de los tokens `info`, etiqueta
// "Event" y la fecha concreta en grande) para que no se lea como un recurso más. Su acción principal es "Get directions".
export function EventResourceCard({ resource: r, onAction }: { resource: ResourceNearby; onAction: (kind: ResourceActionKind) => void }) {
  const now = useNow();
  const when = eventLabel(r, now);
  const action = resourceAction(r, true);
  const sample = isSample(r);
  return (
    <View style={styles.event} accessibilityLabel={`Event: ${r.name}${when ? `, ${when}` : ""}`}>
      <View style={styles.eHead}>
        <View style={styles.eTag}><CalendarDays size={14} color={C.white} /><Text style={styles.eTagT}>Event</Text></View>
        {when ? <Text style={styles.eWhen} numberOfLines={2}>{when}</Text> : null}
      </View>
      <Text style={styles.eName}>{r.name}</Text>
      {sample ? <SampleTag /> : null}
      <TagChips r={r} />
      <Text style={styles.eDesc}>{r.description}</Text>
      <View style={styles.foot}>
        <Text style={styles.eDist}>{r.distance_mi.toFixed(1)} mi away</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${action.label}: ${r.name}`} accessibilityState={{ disabled: sample }}
          onPress={() => onAction(action.kind)} style={({ pressed }) => [styles.eBtn, sample && styles.eBtnOff, pressed && { opacity: 0.85 }]}>
          <action.Icon size={14} color={sample ? C.slate500 : C.white} /><Text style={[styles.eBtnT, sample && { color: C.slate500 }]}>{action.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Tarjeta de recurso comunitario del feed (fase 3.4): variante NEUTRAL (la misma tarjeta blanca con borde que usan los reportes) para
// que no compita con los reportes urgentes ni se lea como publicidad. Etiqueta superior "Community resource" + fecha concreta.
export function CommunityResourceCard({ resource: r, onPress }: { resource: ResourceNearby; onPress: () => void }) {
  const when = eventLabel(r, useNow());
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Community resource: ${r.name}`} onPress={onPress} style={({ pressed }) => [styles.neutral, pressed && { opacity: 0.9 }]}>
      <View style={styles.nIcon}><HeartHandshake size={22} color={C.slate700} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.nKind}>Community resource</Text>
        <Text style={styles.nName} numberOfLines={2}>{r.name}</Text>
        {isSample(r) ? <SampleTag /> : null}
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
  name: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  desc: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19, color: C.slate700 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6 },
  dist: { fontFamily: font.bodyBold, fontSize: 12, color: C.teal },
  btn: { minHeight: MIN_HIT - 4, paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.ink, backgroundColor: C.white, flexDirection: "row", gap: 6, alignItems: "center" },
  btnT: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  btnOff: { borderColor: C.border2, backgroundColor: C.surface },
  event: { gap: 8, padding: 16, borderRadius: radius.lg, backgroundColor: C.infoTint, borderWidth: 2, borderColor: C.info },
  eHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 4 },
  eTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: C.info },
  eTagT: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 0.5, textTransform: "uppercase", color: C.white },
  eWhen: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 15, color: C.info },
  eName: { fontFamily: font.head, fontSize: 19, color: C.ink },
  eDesc: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 20, color: C.slate700 },
  eDist: { fontFamily: font.bodyBold, fontSize: 12, color: C.info },
  eBtn: { minHeight: MIN_HIT - 4, paddingHorizontal: 18, borderRadius: radius.md, backgroundColor: C.info, flexDirection: "row", gap: 6, alignItems: "center" },
  eBtnOff: { backgroundColor: C.border },
  eBtnT: { fontFamily: font.bodyBold, fontSize: 13, color: C.white },
  neutral: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  nIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: C.surface, alignItems: "center", justifyContent: "center" },
  nKind: { fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: C.slate500 },
  nName: { fontFamily: font.head, fontSize: 16, color: C.ink },
  nWhen: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate700 },
  nDist: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
});
