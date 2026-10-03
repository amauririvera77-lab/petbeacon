import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { captureRef } from "react-native-view-shot";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { FlyerTemplate } from "../components/flyer/FlyerTemplate";
import { Primary } from "../components/Primary";
import { loadFlyerData, reportUrl, type FlyerReport } from "../lib/flyer";
import { Theme, MIN_HIT } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

// Genera el flyer como IMAGEN real (PNG 1080×1440), no solo texto (CLAUDE.md §5.7): se puede compartir y guardar.
export default function FlyerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const shot = useRef<View>(null);
  const [data, setData] = useState<{ report: FlyerReport; contact: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [busy, setBusy] = useState<"share" | "save" | null>(null);

  useEffect(() => {
    if (!id) { setError("Missing report."); return; }
    loadFlyerData(id).then((d) => { setData(d); if (!d.report.photo_url) setPhotoReady(true); }).catch((e) => setError(e.message));
  }, [id]);

  const url = id ? reportUrl(id) : null;
  const isLost = data?.report.status === "lost";
  const title = isLost ? "Share Flyer" : "Share Sighting";

  const render = async () => {
    const uri = await captureRef(shot, { format: "png", quality: 1, width: 1080, height: 1440, result: "tmpfile" });
    return uri;
  };

  const share = async () => {
    setBusy("share");
    try {
      if (!(await Sharing.isAvailableAsync())) return Alert.alert("Sharing isn't available on this device.");
      await Sharing.shareAsync(await render(), { mimeType: "image/png", UTI: "public.png", dialogTitle: title });
    } catch (e) {
      Alert.alert("Couldn't share the flyer", e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(null); }
  };

  const save = async () => {
    setBusy("save");
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true); // solo escritura: no leemos tus fotos
      if (!perm.granted) return Alert.alert("Permission needed", "Allow PetBeacon to save to your Photos in Settings, or use Share instead.");
      await MediaLibrary.Asset.create(await render());
      Alert.alert("Saved", "The flyer is in your Photos, ready to print.");
    } catch (e) {
      Alert.alert("Couldn't save the flyer", e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(null); }
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.top}>
        <AppText role="title" style={styles.h} accessibilityRole="header">{data ? title : "Flyer"}</AppText>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}><X size={22} color={Theme.text.primary} /></Pressable>
      </View>

      {error ? (
        <View style={styles.center}><AppText style={styles.err}>{error}</AppText></View>
      ) : !data ? (
        <View style={styles.center}><ActivityIndicator color={Theme.brand.primary} /></View>
      ) : data.report.status === "reunited" ? (
        <View style={styles.center}><AppText style={styles.err}>This case is closed — there's no flyer to share.</AppText></View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 12, gap: 12 }}>
            <View ref={shot} collapsable={false} style={styles.shadow}>
              <FlyerTemplate report={data.report} contact={data.contact} url={url} onPhotoReady={() => setPhotoReady(true)} />
            </View>
            {!url ? <AppText style={styles.warn}>Web page URL not set (EXPO_PUBLIC_WEB_BASE_URL), so this flyer has no QR code yet.</AppText> : null}
            {isLost && !data.contact ? <AppText style={styles.note}>The owner's phone number only appears on flyers created by the owner.</AppText> : null}
          </ScrollView>
          <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Primary label={busy === "share" ? "Preparing…" : "Share"} onPress={share} disabled={!photoReady || !!busy} />
            <Button label={busy === "save" ? "Saving…" : "Save image"} variant="secondary" onPress={save} disabled={!photoReady || !!busy} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.surface.page },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 4 },
  h: { ...typography.title24, color: Theme.text.primary },
  close: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  err: { ...typography.body14, color: Theme.text.secondary, textAlign: "center" },
  shadow: { backgroundColor: Theme.surface.card, ...elevation[2] },
  warn: { ...typography.label13, color: Theme.danger.text, textAlign: "center", paddingHorizontal: 24 },
  note: { ...typography.caption12, color: Theme.text.muted, textAlign: "center", paddingHorizontal: 24 },
  actions: { paddingHorizontal: 16, paddingTop: 12, gap: 10, backgroundColor: Theme.surface.card, borderTopWidth: 1, borderTopColor: Theme.border.default },
});
