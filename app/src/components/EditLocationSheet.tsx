import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { updateProfileLocation } from "../lib/account";
import { geocodeCity } from "../lib/geocode";
import { useSession } from "../state/session";
import { C, font } from "../theme/tokens";
import { Primary } from "./Primary";
import { TextField } from "./TextField";

// Hoja "Edit location" (prototipo): corrige la ciudad si se detectó mal. Se geocodifica para mover el centro del feed y el mapa.
export function EditLocationSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { city, update } = useSession();
  const [draft, setDraft] = useState(city);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const next = draft.trim();
    if (!next) { setError("Enter a city or ZIP code."); return; }
    setBusy(true); setError(null);
    const home = await geocodeCity(next);
    setBusy(false);
    if (!home) { setError("We couldn't find that place. Try a nearby city or a ZIP code."); return; }
    update({ city: next, home });
    updateProfileLocation(next, home);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={() => { setDraft(city); setError(null); }}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <Text style={styles.title} accessibilityRole="header">Edit location</Text>
          <TextField label="City or ZIP code" value={draft} onChangeText={setDraft} placeholder="North Bergen, NJ" autoCapitalize="words"
            helper={error ?? "Use this if your location was detected incorrectly."} />
          <View style={{ height: 24 }} />
          <Primary label={busy ? "Saving…" : "Save"} onPress={save} disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  title: { fontFamily: font.head, fontSize: 18, color: C.ink, paddingVertical: 12 },
});
