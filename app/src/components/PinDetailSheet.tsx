import { router } from "expo-router";
import { Cat, Check, Dog, Eye, MapPin, PawPrint, Pencil, Share2, X } from "lucide-react-native";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReportNearby } from "../lib/database.types";
import { C, font, radius } from "../theme/tokens";
import { FLYERS_READY } from "../lib/flyer";
import { reportShareText } from "../lib/shareText";
import { activityAt } from "../lib/activity";
import { shortAddress } from "../lib/address";
import { cleanFeatures, reportTitle } from "../lib/reportText";
import { whenLabel } from "../lib/time";
import { colorLabel, sizeLabel } from "../lib/petOptions";
import { CONDITION_LABEL } from "./flow/OptionButtons";
import { Badge } from "./Badge";
import { FocusImage } from "./FocusImage";

const COLOR = { lost: C.sos, sighted: C.warn, reunited: C.ok } as const;

// Tres estados distintos (CLAUDE.md §2), no uno con texto condicional. El botón del flyer solo aparece con FLYERS_READY (lib/flyer.ts):
//  · Lost      → "I've seen this pet" + "Share flyer"
//  · Sighted   → "Report to network" + "Share sighting"
//  · Reunited  → caja verde de cierre, sin botones de acción
export function PinDetailSheet({ report, onClose, mine, onMarkReunited }: {
  report: ReportNearby | null; onClose: () => void; mine?: boolean; onMarkReunited?: (r: ReportNearby) => void | Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [photoFailed, setPhotoFailed] = useState(false);
  const r = report;
  const status = r?.status;
  const color = status ? COLOR[status] : C.sos;
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
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
              <View style={styles.photo}>
                {r.photo_url && !photoFailed ? (
                  <FocusImage uri={r.photo_url} focusX={r.photo_focus_x} focusY={r.photo_focus_y} style={styles.photoImg} accessibilityLabel={title} onError={() => setPhotoFailed(true)} />
                ) : <Fallback size={56} color={C.slate500} />}
              </View>

              <View style={styles.titleRow}>
                <Text style={styles.h}>{title}</Text>
                <Badge status={r.status} sitOnBaseline />
              </View>
              {r.breed && r.breed.trim() !== title ? <Text style={styles.breed}>{r.breed}</Text> : <View style={{ height: 24 }} />}

              <View style={{ gap: 16, marginBottom: 24 }}>
                <View style={styles.row}>
                  <View style={{ marginTop: 2 }}><MapPin size={18} color={color} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.strong}>{whenLabel(activityAt(r))}{r.location_label ? ` · ${shortAddress(r.location_label)}` : ""}</Text>
                    <Text style={styles.muted}>{r.distance_mi.toFixed(1)} mi from you</Text>
                  </View>
                </View>
                {colorLabel(r.color) || sizeLabel(r.size) ? (
                  <View style={styles.row}>
                    <View style={{ marginTop: 2 }}><PawPrint size={18} color={C.slate500} /></View>
                    <Text style={styles.features}>{[colorLabel(r.color), sizeLabel(r.size)].filter(Boolean).join(" · ")}</Text>
                  </View>
                ) : null}
                {r.condition ? (
                  <View style={styles.row}>
                    <View style={{ marginTop: 2 }}><Eye size={18} color={C.slate500} /></View>
                    <Text style={styles.features}>Condition: {CONDITION_LABEL[r.condition]}</Text>
                  </View>
                ) : null}
                {cleanFeatures(r.features_description) ? (
                  <View style={styles.row}>
                    <View style={{ marginTop: 2 }}><PawPrint size={18} color={C.slate500} /></View>
                    <Text style={styles.features}>{cleanFeatures(r.features_description)}</Text>
                  </View>
                ) : null}
              </View>

              {status === "reunited" ? (
                <View style={styles.closed}>
                  <Check size={20} color="#166534" />
                  <Text style={styles.closedT}>Great news — this case is closed.</Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  <Pressable accessibilityRole="button" onPress={ownLost ? editOwn : status === "lost" ? iveSeen : share}
                    style={({ pressed }) => [styles.cta, { backgroundColor: color }, pressed && { opacity: 0.9 }]}>
                    {ownLost ? <Pencil size={18} color={C.white} /> : status === "lost" ? <Eye size={18} color={C.white} /> : <Share2 size={18} color={C.white} />}
                    <Text style={styles.ctaT}>{ownLost ? "Edit report" : status === "lost" ? "I've seen this pet" : "Report to network"}</Text>
                  </Pressable>
                  {ownLost ? (
                    // Modo dueño: cerrar el caso. "Share flyer" se oculta mientras el flyer no funcione (FLYERS_READY).
                    <>
                      {onMarkReunited ? (
                        <Pressable accessibilityRole="button" onPress={confirmReunited} style={({ pressed }) => [styles.secondary, pressed && { backgroundColor: C.okTint }]}>
                          <Check size={16} color={C.ok} />
                          <Text style={styles.secondaryT}>Mark as reunited</Text>
                        </Pressable>
                      ) : null}
                      {FLYERS_READY ? (
                        <Pressable accessibilityRole="button" onPress={openFlyer} style={({ pressed }) => [styles.secondary, pressed && { backgroundColor: "#F1F5F9" }]}>
                          <Share2 size={16} color={C.ink} /><Text style={styles.secondaryT}>Share flyer</Text>
                        </Pressable>
                      ) : null}
                    </>
                  ) : FLYERS_READY ? (
                    // "Share flyer" / "Share sighting" abren el flyer: se ocultan en TODOS los detalles mientras FLYERS_READY sea false.
                    <Pressable accessibilityRole="button" onPress={openFlyer} style={({ pressed }) => [styles.secondary, pressed && { backgroundColor: "#F1F5F9" }]}>
                      <Share2 size={16} color={C.ink} />
                      <Text style={styles.secondaryT}>{status === "sighted" ? "Share sighting" : "Share flyer"}</Text>
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
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.55)" },
  sheet: { maxHeight: "78%", backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  close: { position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", zIndex: 2 },
  photo: { height: 220, borderRadius: radius.lg, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20 },
  photoImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  // baseline + Badge.sitOnBaseline: la base (borde inferior) de la píldora queda sobre la línea en la que se apoya el nombre.
  titleRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 4 },
  h: { flexShrink: 1, fontFamily: font.displayMedium, fontSize: 26, lineHeight: 31, letterSpacing: -0.26, color: C.ink },
  breed: { fontFamily: font.bodyRegular, fontSize: 15, color: C.slate700, marginBottom: 24 },
  row: { flexDirection: "row", gap: 12 },
  strong: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  muted: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500, marginTop: 2 },
  features: { flex: 1, fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 21, color: C.slate700 },
  closed: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.md, backgroundColor: C.okTint },
  closedT: { flex: 1, fontFamily: font.bodyBold, fontSize: 14, color: "#166534" },
  cta: { height: 56, borderRadius: radius.md, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  ctaT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
  secondary: { height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  secondaryT: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
});
