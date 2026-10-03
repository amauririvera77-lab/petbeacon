import { useState } from "react";
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from "react-native";
import type { ResourceNearby } from "../../lib/database.types";
import { openStatus } from "../../lib/openHours";
import { tagLabels } from "../../lib/resources";
import { Theme, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// "Open now" / "Closed · Opens 9am" según los horarios estructurados y la zona horaria del recurso. Sin horarios, no se muestra nada.
export function OpenNow({ r, now }: { r: Pick<ResourceNearby, "opening_hours" | "timezone">; now: number }) {
  const s = openStatus(r.opening_hours, r.timezone ?? undefined, now);
  if (!s) return null;
  // flexShrink + una sola línea: comparte fila con la distancia (evaluación UX) sin forzar el salto a una segunda línea.
  return <Text numberOfLines={1} style={[styles.open, s.open ? { color: Theme.status.reunited.bg } : { color: Theme.text.secondary }]}>{s.label}</Text>;
}

// Descripción de una tarjeta de recurso: hasta 2 líneas con un ANCHO EXPLÍCITO medido del contenedor. En iOS, con el ancho
// intrínseco, la descripción de Riverside se medía a 2 líneas pero se pintaba en una sola (cortada, "counseling b…"/"befo"):
// el texto se maquetaba con un ancho y se dibujaba con otro. Dándole el ancho real desde el primer pintado no hay dos mediciones.
export function CardDescription({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  const [w, setW] = useState(0);
  return (
    <View style={{ alignSelf: "stretch" }} onLayout={(e) => { const x = Math.floor(e.nativeEvent.layout.width); if (x !== w) setW(x); }}>
      {w > 0 ? <Text style={[style, { width: w }]} numberOfLines={2}>{text}</Text> : null}
    </View>
  );
}

// Un único componente Tag (Fase 8 de congelación) para todo chip informativo de costo/acceso — mismo estilo en
// cualquier tarjeta, incluida la de evento (ya comparten esta función; esto solo lo formaliza como componente).
export function Tag({ label }: { label: string }) {
  return <View style={styles.tag}><Text style={styles.tagT}>{label}</Text></View>;
}

// Etiquetas de costo y acceso: "Free", "Low cost", "Income-based", "Walk-ins welcome". Siempre en una sola fila con
// wrap — la tarjeta de evento usa la misma fila que el resto, no un tratamiento aparte.
export function TagChips({ r }: { r: Pick<ResourceNearby, "tags"> }) {
  const tags = tagLabels(r);
  if (tags.length === 0) return null;
  return <View style={styles.tags}>{tags.map((t) => <Tag key={t} label={t} />)}</View>;
}

const styles = StyleSheet.create({
  open: { flexShrink: 1, ...typography.label13 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: Theme.brand.tint },
  tagT: { ...typography.badge12, color: Theme.text.primary },
});
