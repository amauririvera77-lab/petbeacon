import { Clock, Globe, Info, MapPin, MessageCircle, Navigation, Phone, ChevronRight, HeartHandshake, X, type LucideIcon } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ResourceNearby } from "../lib/database.types";
import { directionsUrl, isSample, phoneDigits, resourceAction, webUrl, whatsappUrl } from "../lib/resources";
import { eventLabel, isActiveEvent } from "../lib/events";
import { OpenNow, TagChips } from "./resources/parts";
import { useNow } from "../hooks/useNow";
import { Button } from "./Button";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

export type ResourceSheetMode = "detail" | "contact" | "sample";

async function open(url: string | null) {
  if (!url) return;
  try { await Linking.openURL(url); } catch { Alert.alert("Couldn't open that", "Your device couldn't handle this action."); }
}

// Un solo Modal que cambia de contenido (detalle → contacto → aviso de muestra): evita apilar dos modales de iOS y que
// "Contact" no se monte sobre el detalle (CLAUDE.md §2, "sin apilarse"). Fase de congelación 6: un recurso de muestra
// se ve y se toca como cualquier otro — su acción abre "sample" en vez de ejecutarse, nunca se muestra deshabilitado.
export function ResourceModal({ resource, mode, onMode, onClose }: {
  resource: ResourceNearby | null; mode: ResourceSheetMode; onMode: (m: ResourceSheetMode) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 16);
  return (
    <Modal visible={!!resource} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        {resource ? (
          mode === "detail" ? <Detail r={resource} bottom={bottom} onClose={onClose} onContact={() => onMode("contact")} onSample={() => onMode("sample")} />
          : mode === "contact" ? <Contact r={resource} bottom={bottom} onSample={() => onMode("sample")} />
          : <Sample bottom={bottom} onClose={onClose} />
        ) : null}
      </View>
    </Modal>
  );
}

// Explicación breve al tocar la acción de un recurso de muestra (Fase 6): el botón se ve y se comporta como cualquier
// otro, pero no llama a nadie ni abre un mapa real — esto dice por qué, en vez de dejarlo deshabilitado sin explicar.
function Sample({ bottom, onClose }: { bottom: number; onClose: () => void }) {
  return (
    <View style={[styles.sheet, { paddingBottom: bottom }]}>
      <Handle />
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 8 }}>
        <AppText style={styles.sampleTitle} accessibilityRole="header">Sample resource</AppText>
        <AppText style={styles.sampleBody}>This is example data while we add real local resources. Contact details aren't real yet.</AppText>
        <View style={{ marginTop: 8 }}><Button label="Got it" onPress={onClose} /></View>
      </View>
    </View>
  );
}

function Handle() {
  return <View style={styles.handleWrap}><View style={styles.handle} /></View>;
}

function Detail({ r, bottom, onClose, onContact, onSample }: { r: ResourceNearby; bottom: number; onClose: () => void; onContact: () => void; onSample: () => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const place = [`${r.distance_mi.toFixed(1)} mi away`, r.address].filter(Boolean).join(" · ");
  const now = useNow();
  const event = isActiveEvent(r, now);
  const action = resourceAction(r, event);
  const when = event ? eventLabel(r, now) : null;
  const run = () => {
    if (isSample(r)) { onSample(); return; }
    if (action.kind === "contact") onContact();
    else open(action.kind === "directions" ? directionsUrl(r) : webUrl(r.website_url));
  };
  return (
    <View style={[styles.sheet, { height: "78%", paddingBottom: bottom }]}>
      <Handle />
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={Theme.text.secondary} /></Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <View style={styles.photo}>
          {r.photo_url && !photoFailed ? (
            <Image source={{ uri: r.photo_url }} style={styles.photoImg} resizeMode="cover" accessibilityLabel={r.name}
              onError={(e) => { console.warn("resource photo failed:", e.nativeEvent.error, r.photo_url); setPhotoFailed(true); }} />
          ) : <HeartHandshake size={36} color={Theme.text.muted} />}
        </View>
        <View style={styles.titleRow}><HeartHandshake size={20} color={Theme.info.bg} /><AppText role="title" style={styles.h}>{r.name}</AppText></View>
        <AppText style={styles.kind}>Community resource</AppText>
        <View style={{ gap: 16, marginBottom: 24 }}>
          {when ? <Row Icon={Clock} tone={Theme.info.bg} strong>{when}</Row> : !event && r.opening_hours ? <View style={styles.row}><View style={{ marginTop: 2 }}><Clock size={18} color={Theme.info.bg} /></View><OpenNow r={r} now={now} /></View> : r.hours ? <Row Icon={Clock} tone={Theme.info.bg} strong>{r.hours}</Row> : null}
          <Row Icon={MapPin} tone={Theme.info.bg} strong>{place}</Row>
          <Row Icon={Info} tone={Theme.text.muted}>{r.description}</Row>
          <TagChips r={r} />
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <Button Icon={action.Icon} label={action.label} onPress={run} />
        <Pressable accessibilityRole="link" onPress={() => { onClose(); setTimeout(() => router.navigate("/(tabs)/support"), 400); }} style={styles.viewAll}>
          <AppText style={styles.viewAllT}>View all local resources</AppText><ChevronRight size={14} color={Theme.text.muted} />
        </Pressable>
      </View>
    </View>
  );
}

function Row({ Icon, tone, strong, children }: { Icon: LucideIcon; tone: string; strong?: boolean; children: string }) {
  return (
    <View style={styles.row}>
      <View style={{ marginTop: 2 }}><Icon size={18} color={tone} /></View>
      <AppText style={[styles.rowT, strong && styles.rowStrong]}>{children}</AppText>
    </View>
  );
}

function Contact({ r, bottom, onSample }: { r: ResourceNearby; bottom: number; onSample: () => void }) {
  const wa = whatsappUrl(r.phone);
  const web = webUrl(r.website_url);
  const sample = isSample(r);
  const actions: { key: string; label: string; Icon: LucideIcon; tint: string; color: string; run: () => void }[] = [
    r.phone ? { key: "call", label: `Call ${r.phone}`, Icon: Phone, tint: Theme.status.reunited.tint, color: Theme.status.reunited.bg, run: () => open(`tel:${phoneDigits(r.phone)}`) } : null,
    // "#0F7B3F" es el verde de marca de WhatsApp (como el logo, CLAUDE.md §3): deliberadamente fuera del sistema de tokens.
    wa ? { key: "wa", label: "Message on WhatsApp", Icon: MessageCircle, tint: Theme.status.reunited.tint, color: "#0F7B3F", run: () => open(wa) } : null,
    { key: "dir", label: "Open directions in Maps", Icon: Navigation, tint: Theme.info.tint, color: Theme.info.bg, run: () => open(directionsUrl(r)) },
    web ? { key: "web", label: `Visit ${r.website_url}`, Icon: Globe, tint: Theme.brand.tint, color: Theme.brand.primary, run: () => open(web) } : null,
  ].filter(Boolean) as never;
  return (
    <View style={[styles.sheet, { paddingBottom: bottom }]}>
      <Handle />
      <View style={styles.contactHead}>
        <AppText style={styles.contactName}>{r.name}</AppText>
        {r.address ? <AppText style={styles.contactAddr}>{r.address}</AppText> : null}
      </View>
      <View style={{ padding: 8 }}>
        {actions.map(({ key, label, Icon, tint, color, run }) => (
          <Pressable key={key} accessibilityRole="button" onPress={sample ? onSample : run} style={({ pressed }) => [styles.action, pressed && { backgroundColor: Theme.surface.page }]}>
            <View style={[styles.actionIcon, { backgroundColor: tint }]}><Icon size={20} color={color} /></View>
            <AppText style={styles.actionT}>{label}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.scrim(0.55) },
  sheet: { backgroundColor: Theme.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...elevation[3] },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border.default },
  close: { position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", zIndex: 2 },
  photo: { height: 220, borderRadius: radius.lg, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20 },
  photoImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  h: { flex: 1, ...typography.title24, color: Theme.text.primary },
  kind: { ...typography.body14, color: Theme.text.secondary, marginBottom: 24 },
  row: { flexDirection: "row", gap: 12 },
  rowT: { flex: 1, ...typography.body14, color: Theme.text.secondary },
  rowStrong: { ...typography.label14, color: Theme.text.primary },
  viewAll: { minHeight: MIN_HIT, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  viewAllT: { ...typography.label14, color: Theme.text.muted },
  // Título de hoja: Heading/18, como el resto de las hojas. Sin `flex: 1` (en un contenedor de altura automática lo colapsa a 0).
  sampleTitle: { ...typography.heading18, color: Theme.text.primary },
  sampleBody: { ...typography.body14, color: Theme.text.secondary },
  contactHead: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  contactName: { ...typography.heading18, color: Theme.text.primary },
  contactAddr: { ...typography.bodySm13, color: Theme.text.secondary, marginTop: 4 },
  action: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.md },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionT: { flex: 1, ...typography.label14, color: Theme.text.primary },
});
