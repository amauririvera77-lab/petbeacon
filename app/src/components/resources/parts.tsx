import { useState } from "react";
import { StyleSheet, View, useWindowDimensions, type NativeSyntheticEvent, type StyleProp, type TextLayoutEventData, type TextStyle } from "react-native";
import { AppText } from "../AppText";
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
  return <AppText numberOfLines={1} style={[styles.open, s.open ? { color: Theme.status.reunited.bg } : { color: Theme.text.secondary }]}>{s.label}</AppText>;
}

// Descripción de una tarjeta de recurso: hasta 2 líneas COMPLETAS; si el texto necesita más, la segunda termina en "…".
// Historial (iOS): con el ancho intrínseco la descripción de Riverside se medía a 2 líneas pero se dibujaba en una ("befo");
// `numberOfLines` pintaba "b…" y dejaba la segunda línea en blanco; y un `maxHeight = 2 × lineHeight` recortaba la segunda
// línea por la mitad porque la altura REAL de la línea (Manrope ≈ 1.366 em) es mayor que el `lineHeight` nominal (el de la
// tipografía de la app es menor que la natural). Por eso aquí no se supone ninguna altura:
//   1. ancho explícito medido del contenedor (una sola medición, sin dos anchos distintos);
//   2. se maqueta el texto completo con `onTextLayout` y se leen las líneas REALES (`lines[i].text` / `.height`);
//   3. con más de 2 líneas se sustituye el texto por las 2 primeras sin la última palabra + "…" (se vuelve a medir hasta que
//      quepa en 2 — si la "…" desborda a una tercera línea, se quita otra palabra); nunca se recorta una línea a la mitad;
//   4. el tope de altura final es la SUMA de las alturas reales de esas 2 líneas (sirve también con el texto ampliado).
// Hasta tener la medida, el texto va con opacidad 0 (sin parpadeo del texto completo). Se vuelve a medir si cambian el texto,
// el ancho o la escala de fuente del sistema.
type Measure = { key: string; shown: string; ready: boolean; maxH?: number };

export function CardDescription({ text, style }: { text: string; style: StyleProp<TextStyle> }) {
  const { fontScale } = useWindowDimensions();
  const [w, setW] = useState(0);
  const [m, setM] = useState<Measure | null>(null);
  const nominal = StyleSheet.flatten(style)?.lineHeight ?? 20;
  const key = `${text}|${w}|${fontScale}`;
  const cur = m?.key === key ? m : null; // medida vigente; si cambió algo, se empieza de cero con el texto completo
  const shown = cur?.shown ?? text;
  const ready = cur?.ready ?? false;

  const onTextLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const lines = e.nativeEvent.lines;
    if (lines.length === 0) return;
    if (lines.length <= 2) {
      const h = Math.ceil(lines.reduce((sum, l) => sum + (l.height || nominal), 0)) + 1;
      if (!(cur?.ready && cur.maxH === h && cur.shown === shown)) setM({ key, shown, ready: true, maxH: h });
      return;
    }
    // Más de 2 líneas: las 2 primeras enteras, la segunda sin su última palabra y con "…".
    const l0 = lines[0].text, l1 = lines[1].text.trimEnd();
    const head = shown.startsWith(l0 + lines[1].text) ? l0 : l0.trimEnd() + " ";
    const cut = (l1.includes(" ") ? l1.slice(0, l1.lastIndexOf(" ")) : l1.slice(0, -1)).replace(/[\s,;:.\-–—]+$/, "");
    setM({ key, shown: head + cut + "…", ready: false });
  };

  return (
    <View style={{ alignSelf: "stretch", overflow: "hidden", maxHeight: cur?.ready ? cur.maxH : nominal * 2 }}
      onLayout={(e) => { const x = Math.floor(e.nativeEvent.layout.width); if (x !== w) setW(x); }}>
      {w > 0 ? (
        <AppText style={[style, { width: w }, !ready && { opacity: 0 }]} onTextLayout={onTextLayout}
          accessibilityLabel={shown === text ? undefined : text}>{shown}</AppText>
      ) : null}
    </View>
  );
}

// Un único componente Tag (Fase 8 de congelación) para todo chip informativo de costo/acceso — mismo estilo en
// cualquier tarjeta, incluida la de evento (ya comparten esta función; esto solo lo formaliza como componente).
export function Tag({ label }: { label: string }) {
  return <View style={styles.tag}><AppText role="control" style={styles.tagT}>{label}</AppText></View>;
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
