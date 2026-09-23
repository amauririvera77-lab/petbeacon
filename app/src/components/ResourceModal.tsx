import { Clock, Globe, Info, MapPin, MessageCircle, Navigation, Phone, ChevronRight, HeartHandshake, X, type LucideIcon } from "lucide-react-native";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ResourceNearby } from "../lib/database.types";
import { directionsUrl, phoneDigits, webUrl, whatsappUrl } from "../lib/resources";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

export type ResourceSheetMode = "detail" | "contact";

async function open(url: string | null) {
  if (!url) return;
  try { await Linking.openURL(url); } catch { Alert.alert("Couldn't open that", "Your device couldn't handle this action."); }
}

// Un solo Modal que cambia de contenido (detalle → contacto): evita apilar dos modales de iOS y que
// "Contact" no se monte sobre el detalle (CLAUDE.md §2, "sin apilarse").
export function ResourceModal({ resource, mode, onMode, onClose }: {
  resource: ResourceNearby | null; mode: ResourceSheetMode; onMode: (m: ResourceSheetMode) => void; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 16);
  return (
    <Modal visible={!!resource} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        {resource ? (mode === "detail"
          ? <Detail r={resource} bottom={bottom} onClose={onClose} onContact={() => onMode("contact")} />
          : <Contact r={resource} bottom={bottom} />) : null}
      </View>
    </Modal>
  );
}

function Handle() {
  return <View style={styles.handleWrap}><View style={styles.handle} /></View>;
}

function Detail({ r, bottom, onClose, onContact }: { r: ResourceNearby; bottom: number; onClose: () => void; onContact: () => void }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const place = [`${r.distance_mi.toFixed(1)} mi away`, r.address].filter(Boolean).join(" · ");
  return (
    <View style={[styles.sheet, { height: "78%", paddingBottom: bottom }]}>
      <Handle />
      <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
        <View style={styles.photo}>
          {r.photo_url && !photoFailed ? (
            <Image source={{ uri: r.photo_url }} style={styles.photoImg} resizeMode="cover" accessibilityLabel={r.name}
              onError={(e) => { console.warn("resource photo failed:", e.nativeEvent.error, r.photo_url); setPhotoFailed(true); }} />
          ) : <HeartHandshake size={36} color={C.slate500} />}
        </View>
        <View style={styles.titleRow}><HeartHandshake size={20} color={C.info} /><Text style={styles.h}>{r.name}</Text></View>
        <Text style={styles.kind}>Community resource</Text>
        <View style={{ gap: 16, marginBottom: 24 }}>
          {r.hours ? <Row Icon={Clock} tone={C.info} strong>{r.hours}</Row> : null}
          <Row Icon={MapPin} tone={C.info} strong>{place}</Row>
          <Row Icon={Info} tone={C.slate500}>{r.description}</Row>
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 20, gap: 8 }}>
        <Pressable accessibilityRole="button" onPress={onContact} style={styles.primary}>
          <Phone size={18} color={C.white} /><Text style={styles.primaryT}>Contact</Text>
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => { onClose(); router.navigate("/(tabs)/support"); }} style={styles.viewAll}>
          <Text style={styles.viewAllT}>View all local resources</Text><ChevronRight size={14} color={C.slate500} />
        </Pressable>
      </View>
    </View>
  );
}

function Row({ Icon, tone, strong, children }: { Icon: LucideIcon; tone: string; strong?: boolean; children: string }) {
  return (
    <View style={styles.row}>
      <View style={{ marginTop: 2 }}><Icon size={18} color={tone} /></View>
      <Text style={[styles.rowT, strong && styles.rowStrong]}>{children}</Text>
    </View>
  );
}

function Contact({ r, bottom }: { r: ResourceNearby; bottom: number }) {
  const wa = whatsappUrl(r.phone);
  const web = webUrl(r.website_url);
  const actions: { key: string; label: string; Icon: LucideIcon; tint: string; color: string; run: () => void }[] = [
    r.phone ? { key: "call", label: `Call ${r.phone}`, Icon: Phone, tint: C.okTint, color: C.ok, run: () => open(`tel:${phoneDigits(r.phone)}`) } : null,
    wa ? { key: "wa", label: "Message on WhatsApp", Icon: MessageCircle, tint: C.okTint, color: "#0F7B3F", run: () => open(wa) } : null,
    { key: "dir", label: "Open directions in Maps", Icon: Navigation, tint: C.infoTint, color: C.info, run: () => open(directionsUrl(r)) },
    web ? { key: "web", label: `Visit ${r.website_url}`, Icon: Globe, tint: C.tealTint, color: C.teal, run: () => open(web) } : null,
  ].filter(Boolean) as never;
  return (
    <View style={[styles.sheet, { paddingBottom: bottom }]}>
      <Handle />
      <View style={styles.contactHead}>
        <Text style={styles.contactName}>{r.name}</Text>
        {r.address ? <Text style={styles.contactAddr}>{r.address}</Text> : null}
      </View>
      <View style={{ padding: 8 }}>
        {actions.map(({ key, label, Icon, tint, color, run }) => (
          <Pressable key={key} accessibilityRole="button" onPress={run} style={({ pressed }) => [styles.action, pressed && { backgroundColor: C.surface }]}>
            <View style={[styles.actionIcon, { backgroundColor: tint }]}><Icon size={20} color={color} /></View>
            <Text style={styles.actionT}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.55)" },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  close: { position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", zIndex: 2 },
  photo: { height: 220, borderRadius: radius.lg, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 20 },
  photoImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  h: { flex: 1, fontFamily: font.displayMedium, fontSize: 26, letterSpacing: -0.26, color: C.ink },
  kind: { fontFamily: font.bodyRegular, fontSize: 15, color: C.slate700, marginBottom: 24 },
  row: { flexDirection: "row", gap: 12 },
  rowT: { flex: 1, fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 21, color: C.slate700 },
  rowStrong: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  primary: { height: 56, borderRadius: radius.md, backgroundColor: C.info, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center" },
  primaryT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
  viewAll: { minHeight: MIN_HIT, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  viewAllT: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate500 },
  contactHead: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  contactName: { fontFamily: font.head, fontSize: 18, color: C.ink },
  contactAddr: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700, marginTop: 4 },
  action: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.md },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionT: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
});
