import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ReportNearby } from "../lib/database.types";
import { agoShort } from "../lib/time";
import { C, font, radius } from "../theme/tokens";
import { Badge, BadgeStatus } from "./Badge";
import { FocusImage } from "./FocusImage";
import { SpeciesPlaceholder } from "./SpeciesPlaceholder";

const SPECIES_LABEL: Record<string, string> = { dog: "Dog", cat: "Cat", other: "Pet" };

// Tarjeta del feed (fase 3.2). Tres columnas:
//   · foto (o silueta por especie si no hay foto)
//   · centro: nombre + píldora (si no caben en una línea, la píldora pasa DEBAJO del nombre, nunca se solapan) y, en la segunda
//     línea, raza/descripción, que sí puede cortarse con puntos suspensivos
//   · derecha: distancia y tiempo, uno bajo el otro; NUNCA se truncan (flexShrink 0)
// En iOS los tamaños de texto de accesibilidad de Dynamic Type (AX1 = 1.64×) empiezan bien por encima de xxxLarge (1.35×).
const ACCESSIBILITY_FONT_SCALE = 1.5;

// `matchFor`: nombre de tu mascota perdida con la que coincide este avistamiento (solo el dueño lo recibe; fase A.4).
export function ReportCard({ report, onPress, mine, matchFor }: { report: ReportNearby; onPress?: () => void; mine?: boolean; matchFor?: string }) {
  const { fontScale } = useWindowDimensions();
  // Con texto de accesibilidad, distancia y tiempo pasan DEBAJO del nombre (columna central) para no robarle ancho.
  const stacked = fontScale >= ACCESSIBILITY_FONT_SCALE;
  const title = report.name?.trim() || `Unknown ${SPECIES_LABEL[report.species].toLowerCase()}`;
  const sub = report.breed?.trim() || report.features_description?.trim() || null;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {report.photo_url ? (
        <FocusImage uri={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} zoom={(report.photo_zoom ?? 100) / 100} style={styles.photo} />
      ) : (
        <SpeciesPlaceholder species={report.species} size={64} />
      )}
      <View style={styles.center}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>{title}</Text>
          <Badge status={report.status as BadgeStatus} />
          {mine ? <View style={styles.mine}><Text style={styles.mineT}>Your report</Text></View> : null}
          {matchFor ? <View style={styles.match} accessibilityLabel={`Match for ${matchFor}`}><Text style={styles.matchT} numberOfLines={1}>Match for {matchFor}</Text></View> : null}
        </View>
        {stacked ? (
          <Text style={styles.meta}>{report.distance_mi.toFixed(1)} mi · {agoShort(report.created_at)}</Text>
        ) : null}
        {sub ? <Text style={styles.sub} numberOfLines={stacked ? 2 : 1}>{sub}</Text> : null}
      </View>
      {stacked ? null : (
        <View style={styles.right}>
          <Text style={styles.distance} numberOfLines={1}>{report.distance_mi.toFixed(1)} mi</Text>
          <Text style={styles.time} numberOfLines={1}>{agoShort(report.created_at)}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  photo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: C.surface },
  center: { flex: 1, minWidth: 0, gap: 4 },
  // flexWrap: si el nombre y la píldora no caben juntos, la píldora baja a la línea siguiente en lugar de solaparse.
  titleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 8, rowGap: 4 },
  name: { flexShrink: 1, fontFamily: font.head, fontSize: 17, color: C.ink },
  // Etiqueta neutra (borde y texto ink): el rojo queda reservado a Lost y al badge de notificaciones.
  mine: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: C.ink, backgroundColor: C.white },
  // Mismos tokens de éxito que la tarjeta de coincidencia (fondo okTint, borde ok).
  match: { flexShrink: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: C.ok, backgroundColor: C.okTint },
  matchT: { fontFamily: font.bodyBold, fontSize: 11, color: C.ink },
  mineT: { fontFamily: font.bodyBold, fontSize: 11, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  meta: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  right: { flexShrink: 0, alignItems: "flex-end", gap: 2, paddingTop: 2 },
  distance: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  time: { fontFamily: font.bodySemi, fontSize: 12, color: C.slate500 },
});
