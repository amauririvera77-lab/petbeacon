import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { ReportNearby } from "../lib/database.types";
import { reportSubtitle, reportTitle } from "../lib/reportText";
import { agoShort } from "../lib/time";
import { C, font, radius } from "../theme/tokens";
import { Badge, BadgeStatus } from "./Badge";
import { FocusImage } from "./FocusImage";
import { SpeciesPlaceholder } from "./SpeciesPlaceholder";

// Tarjeta del feed. Tres columnas:
//   · foto (o silueta por especie si no hay foto)
//   · centro: título en UNA línea (ellipsis; el nombre completo está en el detalle) + badge de estado; debajo, una segunda línea de altura
//     fija que empieza por la etiqueta contextual ("Your report" o "Match for [pet]") seguida de raza/rasgos. La etiqueta vive DENTRO de esa
//     línea, así que con o sin ella la tarjeta mide lo mismo.
//   · derecha: distancia y tiempo, uno bajo el otro; NUNCA se truncan (flexShrink 0)
// En iOS los tamaños de texto de accesibilidad de Dynamic Type (AX1 = 1.64×) empiezan bien por encima de xxxLarge (1.35×): entonces
// distancia y tiempo pasan bajo el título y la segunda línea admite 2 líneas.
const ACCESSIBILITY_FONT_SCALE = 1.5;

// `matchFor`: nombre de tu mascota perdida con la que coincide este avistamiento (solo el dueño lo recibe; fase A.4).
export function ReportCard({ report, onPress, mine, matchFor }: { report: ReportNearby; onPress?: () => void; mine?: boolean; matchFor?: string }) {
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= ACCESSIBILITY_FONT_SCALE;
  const title = reportTitle(report);
  const sub = reportSubtitle(report);
  const label = mine ? (
    <Text style={styles.mineT}>Your report</Text>
  ) : matchFor ? (
    <View style={styles.match} accessibilityLabel={`Match for ${matchFor}`}><Text style={styles.matchT} numberOfLines={1}>Match for {matchFor}</Text></View>
  ) : null;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {report.photo_url ? (
        <FocusImage uri={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} zoom={(report.photo_zoom ?? 100) / 100} style={styles.photo} />
      ) : (
        <SpeciesPlaceholder species={report.species} size={64} />
      )}
      <View style={styles.center}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{title}</Text>
          <Badge status={report.status as BadgeStatus} />
        </View>
        {stacked ? (
          <Text style={styles.meta}>{report.distance_mi.toFixed(1)} mi · {agoShort(report.created_at)}</Text>
        ) : null}
        {label || sub ? (
          <View style={styles.subRow}>
            {label}
            {label && sub ? <Text style={styles.dotSep}>·</Text> : null}
            {sub ? <Text style={styles.sub} numberOfLines={stacked ? 2 : 1}>{sub}</Text> : null}
          </View>
        ) : null}
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // 16 px (antes 17): con el badge al lado, "Golden Retriever" cabe en una línea en un iPhone de 393 pt (medido en réplica: 133 de 133 px).
  name: { flexShrink: 1, fontFamily: font.head, fontSize: 16, color: C.ink },
  // Segunda línea de altura fija (20): la etiqueta "Your report" / "Match for …" no cambia la altura de la tarjeta.
  subRow: { minHeight: 20, flexDirection: "row", alignItems: "center", gap: 6 },
  mineT: { fontFamily: font.bodyBold, fontSize: 12, color: C.ink },
  // Etiqueta de coincidencia: tokens de éxito de la tarjeta de coincidencia (fondo okTint, borde ok); 20 px de alto para caber en la línea.
  match: { flexShrink: 0, maxWidth: "70%", height: 20, justifyContent: "center", paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: C.ok, backgroundColor: C.okTint },
  matchT: { fontFamily: font.bodyBold, fontSize: 11, color: C.ink },
  dotSep: { fontFamily: font.bodyBold, fontSize: 13, color: C.slate500 },
  sub: { flexShrink: 1, fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  meta: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  right: { flexShrink: 0, alignItems: "flex-end", gap: 2, paddingTop: 2 },
  distance: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  time: { fontFamily: font.bodySemi, fontSize: 12, color: C.slate500 },
});
