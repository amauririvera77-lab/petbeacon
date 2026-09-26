import { X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MyMatch } from "../lib/database.types";
import { matchSubtitle, matchTitle } from "../lib/matchCopy";
import { C, MIN_HIT, font, radius } from "../theme/tokens";
import { FocusImage } from "./FocusImage";
import { SpeciesPlaceholder } from "./SpeciesPlaceholder";

// Coincidencia (fase 1.2): título, MOTIVO ("Similar dog seen 0.9 mi from where Max was lost · 1h ago") y un botón explícito
// "View sighting" (el área tocable no depende de adivinar que toda la tarjeta lo es). Color: tokens de éxito (una coincidencia es
// una buena noticia; el rojo queda reservado a Lost y al badge de notificaciones).
export function MatchBanner({ match, onViewSighting, onDismiss }: { match: MyMatch; onViewSighting: () => void; onDismiss: () => void }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      {match.sighted_photo_url ? (
        <FocusImage uri={match.sighted_photo_url} focusX={match.sighted_focus_x} focusY={match.sighted_focus_y} zoom={(match.sighted_zoom ?? 100) / 100} style={styles.photo} />
      ) : (
        <SpeciesPlaceholder species={match.sighted_species ?? "other"} size={48} style={styles.photo} />
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{matchTitle(match)}</Text>
        <Text style={styles.sub}>{matchSubtitle(match)}</Text>
        <Pressable accessibilityRole="button" onPress={onViewSighting} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
          <Text style={styles.ctaT}>View sighting</Text>
        </Pressable>
      </View>
      {/* Zona táctil de 44×44 pt como mínimo. */}
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss match" onPress={onDismiss} hitSlop={4} style={styles.x}><X size={18} color={C.slate700} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 10, padding: 10, borderRadius: radius.lg, backgroundColor: C.okTint, borderWidth: 1, borderColor: C.ok },
  photo: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: C.white },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: font.head, fontSize: 16, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 18, color: C.slate700 },
  cta: { minHeight: MIN_HIT, alignSelf: "flex-start", justifyContent: "center", paddingHorizontal: 16, marginTop: 2, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.ok, backgroundColor: C.white },
  ctaT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
  x: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: -8, marginRight: -8 },
});
