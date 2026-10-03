import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { AppText } from "./AppText";
import type { ReportNearby } from "../lib/database.types";
import { activityAt } from "../lib/activity";
import { reportSubtitle, reportTitle } from "../lib/reportText";
import { agoShort } from "../lib/time";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";
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
    <AppText role="control" style={styles.mineT}>Your report</AppText>
  ) : matchFor ? (
    <View style={styles.match} accessibilityLabel={`Match for ${matchFor}`}><AppText role="control" style={styles.matchT} numberOfLines={1}>Match for {matchFor}</AppText></View>
  ) : null;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      {report.photo_url ? (
        <FocusImage uri={report.photo_url} focusX={report.photo_focus_x} focusY={report.photo_focus_y} style={styles.photo} />
      ) : (
        <SpeciesPlaceholder species={report.species} size={64} />
      )}
      <View style={styles.center}>
        <View style={styles.titleRow}>
          <AppText style={styles.name} numberOfLines={1}>{title}</AppText>
          <Badge status={report.status as BadgeStatus} />
        </View>
        {stacked ? (
          <AppText style={styles.meta}>{report.distance_mi.toFixed(1)} mi · {agoShort(activityAt(report))}</AppText>
        ) : null}
        {label || sub ? (
          <View style={styles.subRow}>
            {label}
            {label && sub ? <AppText style={styles.dotSep}>·</AppText> : null}
            {sub ? <AppText style={styles.sub} numberOfLines={stacked ? 2 : 1}>{sub}</AppText> : null}
          </View>
        ) : null}
      </View>
      {stacked ? null : (
        <View style={styles.right}>
          <AppText style={styles.distance} numberOfLines={1}>{report.distance_mi.toFixed(1)} mi</AppText>
          <AppText style={styles.time} numberOfLines={1}>{agoShort(activityAt(report))}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card },
  photo: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: Theme.surface.page },
  center: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // 16 px (antes 17): con el badge al lado, "Golden Retriever" cabe en una línea en un iPhone de 393 pt (medido en réplica: 133 de 133 px).
  // Heading/16 mantiene los 16px — sin riesgo de truncar por la consolidación tipográfica.
  name: { flexShrink: 1, ...typography.heading16, color: Theme.text.primary },
  // Segunda línea de altura fija (20): la etiqueta "Your report" / "Match for …" no cambia la altura de la tarjeta.
  subRow: { minHeight: 20, flexDirection: "row", alignItems: "center", gap: 6 },
  mineT: { ...typography.badge12, color: Theme.text.primary },
  // Etiqueta de coincidencia: tokens de éxito de la tarjeta de coincidencia (fondo okTint, borde ok); 20 px de alto para caber en la línea.
  match: { flexShrink: 0, maxWidth: "70%", height: 20, justifyContent: "center", paddingHorizontal: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: Theme.status.reunited.bg, backgroundColor: Theme.status.reunited.tint },
  matchT: { ...typography.badge12, color: Theme.text.primary },
  dotSep: { ...typography.label13, color: Theme.text.muted },
  sub: { flexShrink: 1, ...typography.bodySm13, color: Theme.text.secondary },
  meta: { ...typography.label13, color: Theme.text.primary },
  right: { flexShrink: 0, alignItems: "flex-end", gap: 2, paddingTop: 2 },
  distance: { ...typography.label13, color: Theme.text.primary },
  time: { ...typography.label13, color: Theme.text.muted },
});
