import { ChevronRight, MapPin, MoreHorizontal } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Species } from "../../lib/database.types";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";
import { Badge, type BadgeStatus } from "../Badge";
import { FocusImage } from "../FocusImage";
import { SpeciesPlaceholder } from "../SpeciesPlaceholder";

// Cabecera COMÚN de una tarjeta de My Reports (evaluación UX, punto 2): misma estructura, mismo chevron y misma posición de metadatos en
// las tarjetas Lost, Sighted y reunidas recientes. Nunca muestra distancia (solo tiene sentido en el feed cercano a ti, no aquí) ni la
// etiqueta "Your report" (todo en esta pantalla es del usuario). `onMenu` es opcional: hoy solo lo usan los reportes Lost ("⋯" → Edit report).
export function ReportRow({ photoUrl, focusX, focusY, zoom, species, title, badge, timeText, locationText, onOpen, onMenu }: {
  photoUrl: string | null; focusX?: number | null; focusY?: number | null; zoom?: number | null; species: Species;
  title: string; badge: BadgeStatus; timeText: string; locationText: string | null;
  onOpen: () => void; onMenu?: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${title}, open report`} onPress={onOpen} style={styles.open}>
        <View style={styles.photo}>
          {photoUrl ? <FocusImage uri={photoUrl} focusX={focusX} focusY={focusY} zoom={(zoom ?? 100) / 100} style={StyleSheet.absoluteFill} /> : <SpeciesPlaceholder species={species} size={48} />}
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{title}</Text>
            <Badge status={badge} />
          </View>
          <Text style={styles.time}>{timeText}</Text>
          {locationText ? (
            <View style={styles.locRow}>
              <MapPin size={12} color={C.slate500} />
              <Text style={styles.loc} numberOfLines={1}>{locationText}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      {onMenu ? (
        <Pressable accessibilityRole="button" accessibilityLabel="More options" onPress={onMenu} hitSlop={8} style={styles.menu}>
          <MoreHorizontal size={20} color={C.slate500} />
        </Pressable>
      ) : null}
      <View style={styles.chevron} pointerEvents="none"><ChevronRight size={18} color={C.slate500} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  open: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, minHeight: MIN_HIT },
  photo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: C.surface, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  name: { flexShrink: 1, fontFamily: font.head, fontSize: 16, color: C.ink },
  time: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate700 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  loc: { flex: 1, fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
  menu: { width: MIN_HIT - 8, height: MIN_HIT - 8, alignItems: "center", justifyContent: "center" },
  chevron: { width: 20, alignItems: "center" },
});
