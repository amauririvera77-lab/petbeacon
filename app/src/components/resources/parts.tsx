import { StyleSheet, Text, View } from "react-native";
import type { ResourceNearby } from "../../lib/database.types";
import { openStatus } from "../../lib/openHours";
import { tagLabels } from "../../lib/resources";
import { C, font, radius } from "../../theme/tokens";

// Etiqueta discreta "Sample data" (Support and care 5.1): el recurso es ficticio y sus acciones externas están deshabilitadas.
export function SampleTag() {
  return <View style={styles.sample} accessibilityLabel="Sample data"><Text style={styles.sampleT}>Sample data</Text></View>;
}

// "Open now" / "Closed · Opens 9am" según los horarios estructurados y la zona horaria del recurso. Sin horarios, no se muestra nada.
export function OpenNow({ r, now }: { r: Pick<ResourceNearby, "opening_hours" | "timezone">; now: number }) {
  const s = openStatus(r.opening_hours, r.timezone ?? undefined, now);
  if (!s) return null;
  // flexShrink + una sola línea: comparte fila con la distancia (evaluación UX) sin forzar el salto a una segunda línea.
  return <Text numberOfLines={1} style={[styles.open, s.open ? { color: C.ok } : { color: C.slate700 }]}>{s.label}</Text>;
}

// Etiquetas de costo y acceso: "Free", "Low cost", "Income-based", "Walk-ins welcome".
export function TagChips({ r }: { r: Pick<ResourceNearby, "tags"> }) {
  const tags = tagLabels(r);
  if (tags.length === 0) return null;
  return <View style={styles.tags}>{tags.map((t) => <View key={t} style={styles.tag}><Text style={styles.tagT}>{t}</Text></View>)}</View>;
}

const styles = StyleSheet.create({
  sample: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1, borderColor: C.border2, backgroundColor: C.surface },
  sampleT: { fontFamily: font.bodyBold, fontSize: 11, color: C.slate700 },
  open: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 12 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: C.selectBg },
  tagT: { fontFamily: font.bodySemi, fontSize: 11, color: C.ink },
});
