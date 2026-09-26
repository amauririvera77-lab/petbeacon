import { router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { PetPhoto } from "../components/pet/PetPhoto";
import { RemovePetSheet } from "../components/pet/RemovePetSheet";
import { PinDetailSheet } from "../components/PinDetailSheet";
import { Primary } from "../components/Primary";
import { TextField } from "../components/TextField";
import { BreedPicker } from "../components/report/BreedPicker";
import { Chips } from "../components/report/Chips";
import { useHome } from "../hooks/useHome";
import { useMyReports } from "../hooks/useMyReports";
import { EMPTY_BREED, breedById, breedValueFrom, type BreedValue } from "../lib/breeds";
import type { Pet, PetSize, ReportNearby, Species } from "../lib/database.types";
import { COLOR_OPTIONS, SIZE_OPTIONS, choiceToColor, colorToChoice, type ColorChoice } from "../lib/petOptions";
import { petState } from "../lib/petStatus";
import { archivePet, savePet } from "../lib/pets";
import { fetchReportNearby } from "../lib/reportLookup";
import { supabase } from "../lib/supabase";
import { agoShort, elapsedShort } from "../lib/time";
import { useSession } from "../state/session";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

const SPECIES = [{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }, { value: "other", label: "Other" }] as const;

type Form = {
  name: string; species: Species | null; breed: BreedValue; colorChoice: ColorChoice | null; colorOther: string;
  size: PetSize | null; features: string; microchip: string; photoUri: string | null; photoUrl: string | null;
};
const EMPTY: Form = { name: "", species: null, breed: EMPTY_BREED, colorChoice: null, colorOther: "", size: null, features: "", microchip: "", photoUri: null, photoUrl: null };

// Pet profile. Orden: foto → estado y acción de reporte (Report lost / Lost · Missing for 2h + View report) → datos → "Save changes" (única acción
// principal del formulario) → "Remove pet" discreto. El título es el nombre de la mascota. "Save changes" solo se activa con cambios y, si se
// intenta salir con cambios sin guardar, se pregunta "Discard changes?".
export default function PetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { name: userName, city, alertRadiusMi, home } = useSession();
  const center = useHome();
  const { reports: myReports, refresh: refreshMine, markReunited } = useMyReports();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [detail, setDetail] = useState<ReportNearby | null>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [initial, setInitial] = useState<Form>(EMPTY);
  const set = (patch: Partial<Form>) => setF((p) => ({ ...p, ...patch }));

  useFocusEffect(useCallback(() => { refreshMine(); }, [refreshMine]));

  useEffect(() => {
    if (isNew || !supabase) return;
    supabase.from("pets").select("*").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { Alert.alert("Couldn't load this pet", error?.message ?? "It may have been removed."); router.back(); return; }
      const p = data as Pet;
      const c = colorToChoice(p.color);
      const loaded: Form = {
        name: p.name, species: p.species, breed: breedValueFrom(p.breed_id, p.breed, p.species), colorChoice: c.choice, colorOther: c.other,
        size: p.size, features: p.features ?? "", microchip: p.microchip ?? "", photoUri: null, photoUrl: p.photo_url,
      };
      setF(loaded); setInitial(loaded); setLoading(false);
    });
  }, [id, isNew]);

  const valid = f.name.trim().length > 0 && !!f.species;
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const profile = { name: userName, city, alertRadiusMi, home };

  // Cambios sin guardar: al intentar volver (botón, gesto o cierre) se pregunta. Tras guardar o retirar se permite salir.
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  const allowExit = useRef(false);
  useEffect(() => navigation.addListener("beforeRemove", (e) => {
    if (!dirtyRef.current || allowExit.current) return;
    e.preventDefault();
    Alert.alert("Discard changes?", "You have changes that haven't been saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => { allowExit.current = true; navigation.dispatch(e.data.action); } },
    ]);
  }), [navigation]);

  const save = async () => {
    if (!valid || !f.species) return;
    setSaving(true);
    try {
      await savePet(isNew ? null : id, {
        name: f.name, species: f.species, breed: f.breed.text || null, breedId: f.breed.id,
        color: choiceToColor(f.colorChoice, f.colorOther), size: f.size, features: f.features, microchip: f.microchip,
        photoUri: f.photoUri, photoUrl: f.photoUrl,
      }, profile);
      allowExit.current = true;
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

  const remove = async (reason: "removed" | "passed_away") => {
    setRemoving(true);
    try { await archivePet(id, reason); allowExit.current = true; setRemoveOpen(false); router.back(); }
    catch (e) { Alert.alert("Couldn't remove", e instanceof Error ? e.message : "Something went wrong."); }
    finally { setRemoving(false); }
  };

  const onSpecies = (species: Species) => {
    const b = breedById(f.breed.id);
    set({ species, breed: b?.species && b.species !== species ? EMPTY_BREED : f.breed }); // una raza de perro no vale para un gato
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={C.ink} /></Pressable>
        <Text style={styles.h} accessibilityRole="header" numberOfLines={1}>{isNew ? "Add a Pet" : f.name.trim() || "Pet"}</Text>
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={C.teal} /></View> : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <PetPhoto uri={f.photoUri ?? f.photoUrl} petName={f.name} onChange={(u) => set({ photoUri: u, photoUrl: u ? f.photoUrl : null })} />

          {/* Estado y acción de reporte, arriba junto a la foto. "Report lost" solo existe con la mascota en casa (Home). */}
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

          <TextField label="Pet's name" placeholder="Max" value={f.name} onChangeText={(name) => set({ name })} />
          <Chips label="Type" options={SPECIES} value={f.species} onChange={onSpecies} />
          <BreedPicker species={f.species} value={f.breed} onChange={(breed) => set({ breed })} />

          <Chips label="Main color" options={COLOR_OPTIONS} value={f.colorChoice} onChange={(colorChoice) => set({ colorChoice })} />
          {f.colorChoice === "other" ? <TextField label="Describe the color" placeholder="Brindle" value={f.colorOther} onChangeText={(colorOther) => set({ colorOther })} maxLength={30} /> : null}
          <Chips label="Size" options={SIZE_OPTIONS} value={f.size} onChange={(size) => set({ size })} />
          <View style={{ gap: 6 }}>
            <TextField label="Distinctive features (optional)" placeholder="Blue collar, white paws, scar on left ear" value={f.features} onChangeText={(features) => set({ features })} multiline maxLength={100} />
            <Text style={styles.counter}>{f.features.length}/100</Text>
          </View>
          <TextField label="Microchip number (optional)" placeholder="15-digit number" value={f.microchip} onChangeText={(microchip) => set({ microchip })}
            autoCapitalize="characters" autoCorrect={false} maxLength={20} helper="Only you can see this. It's never shown publicly." />

          <Primary label={saving ? "Saving…" : isNew ? "Add pet" : "Save changes"} onPress={save} disabled={!valid || saving || (!isNew && !dirty)} />
          {!isNew ? <Pressable accessibilityRole="button" onPress={() => setRemoveOpen(true)} style={styles.remove}><Text style={styles.removeT}>Remove pet</Text></Pressable> : null}
        </ScrollView>
      )}
      <RemovePetSheet visible={removeOpen} petName={f.name} hasActiveReport={status.state === "lost"} busy={removing} onClose={() => setRemoveOpen(false)} onConfirm={remove} />
      <PinDetailSheet report={detail} mine onClose={() => setDetail(null)}
        onMarkReunited={async (r) => { try { await markReunited(r.id); refreshMine(); } catch (e) { Alert.alert("Couldn't update your report", e instanceof Error ? e.message : "Please try again."); } }} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  h: { flex: 1, fontFamily: font.displayMedium, fontSize: 22, color: C.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  counter: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500, textAlign: "right" },
  stateBox: { gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stateT: { flex: 1, fontFamily: font.bodySemi, fontSize: 14, color: C.ink },
  remove: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  removeT: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate500, textDecorationLine: "underline" },
});
