import { Pressable, StyleSheet, Text, View } from "react-native";
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
export function ReportCard({ report, onPress, mine }: { report: ReportNearby; onPress?: () => void; mine?: boolean }) {
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
        </View>
        {sub ? <Text style={styles.sub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <View style={styles.right}>
        <Text style={styles.distance} numberOfLines={1}>{report.distance_mi.toFixed(1)} mi</Text>
        <Text style={styles.time} numberOfLines={1}>{agoShort(report.created_at)}</Text>
      </View>
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
  mineT: { fontFamily: font.bodyBold, fontSize: 11, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  right: { flexShrink: 0, alignItems: "flex-end", gap: 2, paddingTop: 2 },
  distance: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  time: { fontFamily: font.bodySemi, fontSize: 12, color: C.slate500 },
});
