import { router } from "expo-router";
import { Cat, Check, Dog, Eye, MapPin, Palette, Share2, Sparkles, StickyNote, X } from "lucide-react-native";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReportNearby } from "../lib/database.types";
import { MIN_HIT, Theme, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";
import { FLYERS_READY } from "../lib/flyer";
import { reportShareText } from "../lib/shareText";
import { activityAt } from "../lib/activity";
import { shortAddress } from "../lib/address";
import { cleanFeatures, reportTitle } from "../lib/reportText";
import { breedLabel } from "../lib/breeds";
import { whenLabel } from "../lib/time";
import { colorLabel, sizeLabel } from "../lib/petOptions";
import { CONDITION_LABEL } from "./flow/OptionButtons";
import { FocusImage } from "./FocusImage";
import { WrappingTitleBadge } from "./WrappingTitleBadge";

const COLOR = { lost: Theme.status.lost.bg, sighted: Theme.status.sighted.bg, reunited: Theme.status.reunited.bg } as const;

// Tres estados distintos (CLAUDE.md §2), no uno con texto condicional. El botón del flyer solo aparece con FLYERS_READY (lib/flyer.ts):
//  · Lost      → "I've seen this pet" + "Share flyer"
//  · Sighted   → "Report to network" + "Share sighting"
//  · Reunited  → caja verde de cierre, sin botones de acción
export function PinDetailSheet({ report, onClose, mine, onMarkReunited, matchCount, onReviewMatches }: {
  report: ReportNearby | null; onClose: () => void; mine?: boolean; onMarkReunited?: (r: ReportNearby) => void | Promise<void>;
  matchCount?: number; // coincidencias abiertas (no descartadas) de este Lost propio — decide el CTA principal en modo dueño
  onReviewMatches?: (r: ReportNearby) => void;
}) {
  const insets = useSafeAreaInsets();
  const [photoFailed, setPhotoFailed] = useState(false);
  const r = report;
  const status = r?.status;
  const color = status ? COLOR[status] : Theme.status.lost.bg;
  const title = r ? reportTitle(r) : ""; // el mismo título que la tarjeta, pero aquí completo (sin recortar)
  const Fallback = r?.species === "cat" ? Cat : Dog;

  // Texto para "Report to network" (compartir con tu red): incluye el enlace público cuando existe y nunca el contacto del dueño.
  const shareText = () => (r ? reportShareText(r) : "");
  const share = () => Share.share({ message: shareText() }).catch(() => Alert.alert("Couldn't open sharing"));

  // "Share flyer" / "Share sighting": abre la pantalla que genera la imagen real (tras cerrar el modal, iOS).
  const openFlyer = () => {
    if (!r) return;
    onClose();
    setTimeout(() => router.push({ pathname: "/flyer", params: { id: r.id } }), 400);
  };

  // Reporte propio: en vez de "I've seen this pet" (que sería absurdo para el dueño) se ofrece editarlo.
  const editOwn = () => {
    if (!r) return;
    onClose();
    setTimeout(() => router.push({ pathname: "/edit-report", params: { id: r.id } }), 400);
  };
  const ownLost = !!mine && status === "lost";
  const hasMatches = (matchCount ?? 0) > 0;

  // "Mark as reunited": confirmación explícita antes de cerrar el caso (acción con consecuencias: sale de Lost y se detienen alertas y coincidencias).
  const confirmReunited = () => {
    if (!r || !onMarkReunited) return;
    Alert.alert(`Did you find ${r.name?.trim() || "your pet"}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes, we're reunited", onPress: () => { onClose(); onMarkReunited(r); } },
    ]);
  };

  // "I've seen this pet": abre el flujo de avistamiento con la especie ya elegida. Al publicarse, el matching
  // avisa al dueño (no es un toast: registra un avistamiento real).
  const iveSeen = () => {
    if (!r) return;
    onClose();
    setTimeout(() => router.push({ pathname: "/report/sighted", params: { species: r.species } }), 400); // tras cerrar el modal (iOS)
  };

  return (
    <Modal visible={!!r} transparent animationType="slide" onRequestClose={onClose} onShow={() => setPhotoFailed(false)}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        {r ? (
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handleWrap}><View style={styles.handle} /></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={Theme.text.secondary} /></Pressable>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
              <View style={styles.photo}>
                {r.photo_url && !photoFailed ? (
                  <FocusImage uri={r.photo_url} focusX={r.photo_focus_x} focusY={r.photo_focus_y} style={styles.photoImg} accessibilityLabel={title} onError={() => setPhotoFailed(true)} />
                ) : <Fallback size={56} color={Theme.text.muted} />}
              </View>

              <WrappingTitleBadge title={title} status={r.status} textStyle={styles.h} style={styles.titleRow} />
              {(() => { const b = breedLabel(r.breed, r.breed_id); return b && b !== title ? <AppText style={styles.breed}>{b}</AppText> : <View style={{ height: 24 }} />; })()}

              <View style={{ gap: 16, marginBottom: 24 }}>
                <View style={styles.row}>
                  <View style={{ marginTop: 2 }}><MapPin size={18} color={color} /></View>
                  <View style={{ flex: 1 }}>
                    <AppText style={styles.strong}>{whenLabel(activityAt(r))}{r.location_label ? ` · ${shortAddress(r.location_label)}` : ""}</AppText>
                    <AppText style={styles.muted}>{r.distance_mi.toFixed(1)} mi from you</AppText>
                  </View>
                </View>
                {colorLabel(r.color) || sizeLabel(r.size) ? (
                  <View style={styles.row}>
                    <View style={{ marginTop: 2 }}><Palette size={18} color={Theme.text.muted} /></View>
                    <AppText style={styles.features}>{[colorLabel(r.color), sizeLabel(r.size)].filter(Boolean).join(" · ")}</AppText>
                  </View>
                ) : null}
                {r.condition ? (
                  <View style={styles.row}>
                    <View style={{ marginTop: 2 }}><Eye size={18} color={Theme.text.muted} /></View>
                    <AppText style={styles.features}>Condition: {CONDITION_LABEL[r.condition]}</AppText>
                  </View>
                ) : null}
                {cleanFeatures(r.features_description) ? (
                  <View style={styles.row}>
                    <View style={{ marginTop: 2 }}><StickyNote size={18} color={Theme.text.muted} /></View>
                    <AppText style={styles.features}>{cleanFeatures(r.features_description)}</AppText>
                  </View>
                ) : null}
              </View>

              {status === "reunited" ? (
                <View style={styles.closed}>
                  <Check size={20} color={Theme.status.reunited.text} />
                  <AppText style={styles.closedT}>Great news — this case is closed.</AppText>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {/* brand.primary, no el color de estado (color) — los colores de estado solo indican estados (badges, pins,
                      etiquetas), nunca el fondo de un botón de acción (CLAUDE.md). Modo dueño: misma jerarquía que My Reports
                      (MyReportStatusCard) — "Review matches"/"Share alert" como principal según haya o no coincidencias. */}
                  <Pressable accessibilityRole="button"
                    onPress={ownLost ? (hasMatches ? () => onReviewMatches?.(r) : share) : status === "lost" ? iveSeen : share}
                    style={({ pressed }) => [styles.cta, { backgroundColor: Theme.brand.primary }, pressed && { opacity: 0.9 }]}>
                    {ownLost
                      ? (hasMatches ? <Sparkles size={18} color={Theme.text.onAccent} /> : <Share2 size={18} color={Theme.text.onAccent} />)
                      : status === "lost" ? <Eye size={18} color={Theme.text.onAccent} /> : <Share2 size={18} color={Theme.text.onAccent} />}
                    <AppText role="control" style={styles.ctaT}>{ownLost ? (hasMatches ? "Review matches" : "Share alert") : status === "lost" ? "I've seen this pet" : "Report to network"}</AppText>
                  </Pressable>
                  {ownLost ? (
                    // Modo dueño: cerrar el caso. "Share flyer" se oculta mientras el flyer no funcione (FLYERS_READY).
                    // "Edit report" pasa a acción terciaria (texto), ya no compite con "Review matches"/"Share alert".
                    <>
                      {onMarkReunited ? (
                        <Pressable accessibilityRole="button" onPress={confirmReunited} style={({ pressed }) => [styles.secondary, pressed && { backgroundColor: Theme.status.reunited.tint }]}>
                          <Check size={16} color={Theme.status.reunited.bg} />
                          <AppText role="control" style={styles.secondaryT}>Mark as reunited</AppText>
                        </Pressable>
                      ) : null}
                      {FLYERS_READY ? (
                        <Pressable accessibilityRole="button" onPress={openFlyer} style={({ pressed }) => [styles.secondary, pressed && { backgroundColor: Theme.surface.page }]}>
                          <Share2 size={16} color={Theme.text.primary} /><AppText role="control" style={styles.secondaryT}>Share flyer</AppText>
                        </Pressable>
                      ) : null}
                      <Pressable accessibilityRole="button" onPress={editOwn} style={styles.tertiary}>
                        <AppText style={styles.tertiaryT}>Edit report</AppText>
                      </Pressable>
                    </>
                  ) : FLYERS_READY ? (
                    // "Share flyer" / "Share sighting" abren el flyer: se ocultan en TODOS los detalles mientras FLYERS_READY sea false.
                    <Pressable accessibilityRole="button" onPress={openFlyer} style={({ pressed }) => [styles.secondary, pressed && { backgroundColor: Theme.surface.page }]}>
                      <Share2 size={16} color={Theme.text.primary} />
                      <AppText role="control" style={styles.secondaryT}>{status === "sighted" ? "Share sighting" : "Share flyer"}</AppText>
                    </Pressable>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.scrim(0.55) },
  sheet: { maxHeight: "78%", backgroundColor: Theme.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...elevation[3] },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border.default },
  close: { position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", zIndex: 2 },
  photo: { height: 220, borderRadius: radius.lg, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20 },
  photoImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  // El layout de fila/wrap vive en WrappingTitleBadge; aquí solo el margen respecto al resto del contenido.
  titleRow: { marginBottom: 4 },
  h: { flexShrink: 1, ...typography.heading20, color: Theme.text.primary },
  breed: { ...typography.body14, color: Theme.text.secondary, marginBottom: 24 },
  row: { flexDirection: "row", gap: 12 },
  strong: { ...typography.label14, color: Theme.text.primary },
  muted: { ...typography.bodySm13, color: Theme.text.muted, marginTop: 2 },
  features: { flex: 1, ...typography.body14, color: Theme.text.secondary },
  closed: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: Theme.status.reunited.tint },
  closedT: { flex: 1, ...typography.label13, color: Theme.status.reunited.text },
  cta: { height: 56, borderRadius: radius.md, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  ctaT: { ...typography.button16, color: Theme.text.onAccent },
  secondary: { height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  secondaryT: { ...typography.button14, color: Theme.text.primary },
  // Terciaria: mismo tratamiento que "View all matches" en MyReportStatusCard — texto subrayado, sin fondo ni borde.
  tertiary: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  tertiaryT: { ...typography.label14, color: Theme.text.secondary, textDecorationLine: "underline" },
});
