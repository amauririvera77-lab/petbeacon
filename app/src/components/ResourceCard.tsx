import { CalendarDays, ChevronRight, HeartHandshake } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ResourceNearby } from "../lib/database.types";
import { CATEGORY_STYLE, resourceAction, resourceIcon, type ResourceActionKind } from "../lib/resources";
import { CardDescription, OpenNow, TagChips } from "./resources/parts";
import { eventLabel } from "../lib/events";
import { useNow } from "../hooks/useNow";
import { Button } from "./Button";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

// Tarjeta de Support and care: ícono tintado por categoría, nombre, distancia + "Open now", etiquetas, descripción y la acción
// principal según el tipo de recurso (Contact / Learn more). El botón se ve siempre activo, incluso con datos de muestra —
// tocarlo abre una explicación (Fase 6), nunca se muestra deshabilitado sin decir por qué (Fase 1).
export function ResourceCard({ resource: r, onAction }: { resource: ResourceNearby; onAction: (kind: ResourceActionKind) => void }) {
  const { icon, tile } = CATEGORY_STYLE[r.category];
  const Icon = resourceIcon(r);
  const now = useNow();
  const action = resourceAction(r, false);
  return (
    <View style={styles.card}>
      <View style={[styles.icon, { backgroundColor: tile }]}><Icon size={22} color={icon} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text style={styles.name}>{r.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.dist}>{r.distance_mi.toFixed(1)} mi away</Text>
          <OpenNow r={r} now={now} />
        </View>
        <TagChips r={r} />
        <CardDescription text={r.description} style={styles.desc} />
        <View style={styles.foot}>
          <Button variant="secondary" size="compact" Icon={action.Icon} label={action.label} onPress={() => onAction(action.kind)} />
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
  return (
    <View style={styles.event} accessibilityLabel={`Event: ${r.name}${when ? `, ${when}` : ""}`}>
      <View style={styles.eHead}>
        <View style={styles.eTag}><CalendarDays size={14} color={Theme.text.onAccent} /><Text style={styles.eTagT}>Event</Text></View>
        {when ? <Text style={styles.eWhen} numberOfLines={2}>{when}</Text> : null}
      </View>
      <Text style={styles.eName}>{r.name}</Text>
      <TagChips r={r} />
      <CardDescription text={r.description} style={styles.eDesc} />
      <View style={styles.foot}>
        <Text style={styles.eDist}>{r.distance_mi.toFixed(1)} mi away</Text>
        <Button size="compact" Icon={action.Icon} label={action.label} onPress={() => onAction(action.kind)} />
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
      {/* Mismo contenedor (tamaño, radio, alineación) que la foto/silueta de ReportCard; tokens de "recurso comunitario" (info = blue 700, infoTint = blue 50). */}
      <View style={styles.nIcon}><HeartHandshake size={32} color={Theme.info.bg} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text style={styles.nKind}>Community resource</Text>
        <Text style={styles.nName} numberOfLines={2}>{r.name}</Text>
        {when ? <Text style={styles.nWhen}>{when}</Text> : null}
        <Text style={styles.nDist}>{r.distance_mi.toFixed(1)} mi away</Text>
      </View>
      <ChevronRight size={18} color={Theme.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default },
  icon: { width: 48, height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  name: { ...typography.heading16, color: Theme.text.primary },
  desc: { ...typography.bodySm13, color: Theme.text.secondary },
  // Distancia y estado de apertura SIEMPRE en una sola línea (evaluación UX): sin flexWrap; el estado se encoge antes de saltar de línea.
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  foot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 6 },
  dist: { flexShrink: 0, ...typography.label13, color: Theme.brand.primary },
  event: { gap: 8, padding: 16, borderRadius: radius.lg, backgroundColor: Theme.info.tint, borderWidth: 2, borderColor: Theme.info.bg },
  eHead: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 4 },
  eTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, height: 26, borderRadius: radius.pill, backgroundColor: Theme.info.bg },
  eTagT: { ...typography.badge12, letterSpacing: 0.5, textTransform: "uppercase", color: Theme.text.onAccent },
  eWhen: { flexShrink: 1, ...typography.label14, color: Theme.info.bg },
  eName: { ...typography.heading20, color: Theme.text.primary },
  eDesc: { ...typography.body14, color: Theme.text.secondary },
  eDist: { ...typography.label13, color: Theme.info.bg },
  neutral: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card },
  // Mismas dimensiones y radio que `photo` en ReportCard.tsx (64×64, radius.md), para que la columna de texto empiece a la misma distancia.
  nIcon: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: Theme.info.tint, alignItems: "center", justifyContent: "center" },
  nKind: { ...typography.badge12, letterSpacing: 0.5, textTransform: "uppercase", color: Theme.text.muted },
  nName: { ...typography.heading16, color: Theme.text.primary },
  nWhen: { ...typography.label13, color: Theme.text.secondary },
  nDist: { ...typography.caption12, color: Theme.text.muted },
});
