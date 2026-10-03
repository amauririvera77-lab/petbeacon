import { MapPin } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { AppText } from "../AppText";
import type { Species } from "../../lib/database.types";
import { Theme, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { Badge, type BadgeStatus } from "../Badge";
import { FocusImage } from "../FocusImage";
import { SpeciesPlaceholder } from "../SpeciesPlaceholder";

// Cabecera COMÚN de una tarjeta de My Reports (evaluación UX, punto 2): misma estructura y misma posición de metadatos en las tarjetas
// Lost, Sighted y reunidas recientes. Puramente presentacional — SIN chevron y sin su propio toque: la tarjeta entera lo abre (la envuelve
// un Pressable en el componente que la usa). Nunca muestra distancia (solo tiene sentido en el feed cercano a ti, no aquí) ni la etiqueta
// "Your report" (todo en esta pantalla es del usuario). `reserveMenuSpace` dej a sitio a la derecha para el botón "⋯" que dibuja el padre.
export function ReportRow({ photoUrl, focusX, focusY, species, title, badge, timeText, locationText, reserveMenuSpace }: {
  photoUrl: string | null; focusX?: number | null; focusY?: number | null; species: Species;
  title: string; badge: BadgeStatus; timeText: string; locationText: string | null; reserveMenuSpace?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.photo}>
        {photoUrl ? <FocusImage uri={photoUrl} focusX={focusX} focusY={focusY} style={StyleSheet.absoluteFill} /> : <SpeciesPlaceholder species={species} size={48} />}
      </View>
      <View style={[styles.text, reserveMenuSpace && styles.textWithMenu]}>
        <View style={styles.nameRow}>
          <AppText style={styles.name} numberOfLines={1}>{title}</AppText>
          <Badge status={badge} />
        </View>
        <AppText style={styles.time}>{timeText}</AppText>
        {locationText ? (
          <View style={styles.locRow}>
            <MapPin size={12} color={Theme.text.muted} />
            <AppText style={styles.loc} numberOfLines={1}>{locationText}</AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  photo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: Theme.surface.page, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  text: { flex: 1, gap: 3 },
  textWithMenu: { paddingRight: 32 }, // deja sitio al botón "⋯" que se dibuja encima, en la esquina de la tarjeta
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  name: { flexShrink: 1, ...typography.heading16, color: Theme.text.primary },
  time: { ...typography.label13, color: Theme.text.secondary },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  loc: { flex: 1, ...typography.caption12, color: Theme.text.muted },
});
