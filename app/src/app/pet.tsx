import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { PinDetailSheet } from "../components/PinDetailSheet";
import { Primary } from "../components/Primary";
import { TextField } from "../components/TextField";
import { Chips } from "../components/report/Chips";
import { PhotoPicker } from "../components/report/PhotoPicker";
import { useHome } from "../hooks/useHome";
import { useMyReports } from "../hooks/useMyReports";
import type { Pet, ReportNearby, Species } from "../lib/database.types";
import { petState } from "../lib/petStatus";
import { fetchReportNearby } from "../lib/reportLookup";
import { agoShort, elapsedShort } from "../lib/time";
import { removePet, savePet } from "../lib/pets";
import { supabase } from "../lib/supabase";
import { useSession } from "../state/session";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

const SPECIES = [{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }, { value: "other", label: "Other" }] as const;

// Pet profile: foto, nombre, tipo, raza. Acciones: "Report lost" (prellena el flujo), "Save changes", "Remove pet".
export default function PetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";
  const insets = useSafeAreaInsets();
  const { name: userName, city, alertRadiusMi, home } = useSession();
  const center = useHome();
  const { reports: myReports, refresh: refreshMine, markReunited } = useMyReports();
  const [detail, setDetail] = useState<ReportNearby | null>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species | null>(null);
  const [breed, setBreed] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null); // foto local nueva (se sube al guardar)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // foto ya guardada

  useFocusEffect(useCallback(() => { refreshMine(); }, [refreshMine]));
  useEffect(() => {
    if (isNew || !supabase) return;
    supabase.from("pets").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { Alert.alert("Couldn't load this pet", error?.message ?? "It may have been removed."); router.back(); return; }
      const p = data as Pet;
      setName(p.name); setSpecies(p.species); setBreed(p.breed ?? ""); setPhotoUrl(p.photo_url); setLoading(false);
    });
  }, [id, isNew]);

  const valid = name.trim().length > 0 && !!species;
  const profile = { name: userName, city, alertRadiusMi, home };

  const save = async () => {
    if (!valid || !species) return;
    setSaving(true);
    try {
      await savePet(isNew ? null : id, { name, species, breed: breed || null, photoUri, photoUrl }, profile);
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  };

  // Estado derivado de sus reportes: Home / Lost (reporte activo) / Reunited (24 h).
  const status = isNew || !id ? ({ state: "home" } as const) : petState(id, myReports);
  const viewReport = async () => {
    if (status.state !== "lost") return;
    const r = await fetchReportNearby(status.report.id, center.lat, center.lng);
    if (r) setDetail(r); else Alert.alert("Couldn't open the report", "Please try again in a moment.");
  };

  const confirmRemove = () => {
    if (status.state === "lost") {
      Alert.alert(`${name.trim() || "This pet"} has an active Lost report`, "Mark it as reunited first, then you can remove the pet.");
      return;
    }
    Alert.alert("Remove this pet?", "This removes it from your registered pets. Reports you already published stay active.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removePet(id).then(() => router.back()).catch((e) => Alert.alert("Couldn't remove", e.message)) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={C.ink} /></Pressable>
        <Text style={styles.h} accessibilityRole="header">{isNew ? "Add a pet" : "Pet profile"}</Text>
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={C.teal} /></View> : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 8 }}>
            <Text style={styles.label}>Photo</Text>
            <PhotoPicker uri={photoUri ?? photoUrl} onChange={(u) => { setPhotoUri(u); if (!u) setPhotoUrl(null); }} />
          </View>
          {/* Estado y acción de reporte, justo bajo la foto. "Report lost" solo existe con la mascota en casa (Home). */}
          {!isNew && status.state === "lost" ? (
            <View style={styles.stateBox}>
              <View style={styles.stateRow}>
                <Badge status="lost" />
                <Text style={styles.stateT}>Lost · Missing for {elapsedShort(status.report.created_at)}</Text>
              </View>
              <Button label="View report" variant="secondary" onPress={viewReport} />
            </View>
          ) : null}
          {!isNew && status.state === "reunited" ? (
            <View style={styles.stateBox}>
              <View style={styles.stateRow}>
                <Badge status="reunited" />
                <Text style={styles.stateT}>Reunited · {agoShort(status.report.reunited_at ?? status.report.created_at)}</Text>
              </View>
            </View>
          ) : null}
          {!isNew && status.state === "home" ? (
            <Button label="Report lost" variant="primaryLost" onPress={() => router.push({ pathname: "/report/lost", params: { petId: id } })} />
          ) : null}
          <TextField label="Pet's name" placeholder="Max" value={name} onChangeText={setName} />
          <Chips label="Type" options={SPECIES} value={species} onChange={setSpecies} />
          <TextField label="Breed" placeholder="Golden Retriever" value={breed} onChangeText={setBreed} />

          <View style={{ gap: 10, marginTop: 8 }}>
            <Primary label={saving ? "Saving…" : isNew ? "Add pet" : "Save changes"} onPress={save} disabled={!valid || saving} />
            {!isNew ? <Pressable accessibilityRole="button" onPress={confirmRemove} style={styles.remove}><Text style={styles.removeT}>Remove pet</Text></Pressable> : null}
          </View>
        </ScrollView>
      )}
      <PinDetailSheet report={detail} mine onClose={() => setDetail(null)}
        onMarkReunited={async (r) => { try { await markReunited(r.id); refreshMine(); } catch (e) { Alert.alert("Couldn't update your report", e instanceof Error ? e.message : "Please try again."); } }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  h: { fontFamily: font.displayMedium, fontSize: 22, color: C.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700 },
  stateBox: { gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stateT: { flex: 1, fontFamily: font.bodySemi, fontSize: 14, color: C.ink },
  remove: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  removeT: { fontFamily: font.bodyBold, fontSize: 15, color: C.sosDark },
});
