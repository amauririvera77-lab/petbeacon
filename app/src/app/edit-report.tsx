import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Primary } from "../components/Primary";
import { TextField } from "../components/TextField";
import { Chips } from "../components/report/Chips";
import { LocationPicker } from "../components/report/LocationPicker";
import { ConditionGrid, type Condition } from "../components/flow/OptionButtons";
import { BreedPicker } from "../components/report/BreedPicker";
import { PhotoPicker } from "../components/report/PhotoPicker";
import { useHome } from "../hooks/useHome";
import { EMPTY_BREED, breedById, breedValueFrom, type BreedValue } from "../lib/breeds";
import type { Report, Species } from "../lib/database.types";
import type { Place } from "../lib/geocode";
import { uploadPhoto } from "../lib/photos";
import { supabase } from "../lib/supabase";
import { useSession } from "../state/session";
import { C, MIN_HIT, font } from "../theme/tokens";

const SPECIES = [{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }, { value: "other", label: "Other" }] as const;
type Loaded = Pick<Report, "id" | "status" | "name" | "species" | "breed" | "breed_id" | "pet_id" | "photo_url" | "features_description" | "location_label"> & { condition?: Condition | null };

// Edit report (prototipo): mismos campos que el paso 2 de Report lost pet, prellenados, y un solo botón "Save changes".
// El contacto no se edita aquí (es privado y solo lo lee su dueño).
export default function EditReport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { city } = useSession();
  const center = useHome();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species | null>(null);
  const [breed, setBreed] = useState<BreedValue>(EMPTY_BREED);
  const [petId, setPetId] = useState<string | null>(null);
  const [isSighting, setIsSighting] = useState(false);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [features, setFeatures] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [origPhoto, setOrigPhoto] = useState<string | null>(null);
  // Ubicación: se conserva la guardada ("Saved with this report") hasta que el usuario elija otra.
  const [existingLabel, setExistingLabel] = useState<string | null>(null);
  const [keepLocation, setKeepLocation] = useState(true);
  const [place, setPlace] = useState<Place | null>(null);

  useEffect(() => {
    if (!supabase || !id) return;
    supabase.from("reports").select("id,status,name,species,breed,breed_id,pet_id,photo_url,features_description,location_label,condition").eq("id", id).maybeSingle().then(({ data, error }) => {
      if (error || !data) { Alert.alert("Couldn't load this report", error?.message ?? "It may have been removed."); router.back(); return; }
      const r = data as Loaded;
      setName(r.name ?? ""); setSpecies(r.species); setBreed(breedValueFrom(r.breed_id, r.breed, r.species)); setPetId(r.pet_id); setIsSighting(r.status === "sighted"); setCondition(r.condition ?? null); setFeatures(r.features_description ?? "");
      setPhotoUrl(r.photo_url); setOrigPhoto(r.photo_url); setExistingLabel(r.location_label); setLoading(false);
    });
  }, [id]);

  // Un avistamiento no tiene nombre de mascota: solo hace falta el tipo (y la ubicación, si se cambió).
  const valid = (isSighting || name.trim().length > 0) && !!species && (keepLocation || !!place);

  const save = async () => {
    if (!supabase || !valid || !species) return;
    setSaving(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) throw new Error("You're signed out.");
      const patch: Partial<Report> = {
        name: isSighting ? null : name.trim(), species, ...(isSighting ? { condition } : {}), breed: breed.text.trim() || null, breed_id: breed.id, features_description: features.trim() || null,
      };
      if (photoUri) {
        patch.photo_url = await uploadPhoto(s.session.user.id, photoUri);
      } else if (photoUrl !== origPhoto) {
        patch.photo_url = photoUrl; // se quitó la foto
      }
      // Foto nueva o quitada: el punto focal de la anterior ya no aplica → la app vuelve al foco por defecto.
      if ("photo_url" in patch) { patch.photo_focus_x = null; patch.photo_focus_y = null; patch.photo_zoom = null; }
      if (!keepLocation && place) {
        patch.location = `SRID=4326;POINT(${place.lng} ${place.lat})`;
        patch.location_label = place.label;
      }
      const { error } = await supabase.from("reports").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      // La mascota registrada es la fuente de los datos públicos: se mantiene igual que el reporte (nombre, tipo y raza).
      if (petId) await supabase.from("pets").update({ name: name.trim(), species, breed: breed.text.trim() || null, breed_id: breed.id }).eq("id", petId);
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save your changes", e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={C.ink} /></Pressable>
        <Text style={styles.h} accessibilityRole="header">{isSighting ? "Edit sighting" : "Edit report"}</Text>
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={C.teal} /></View> : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Photo</Text>
              <PhotoPicker uri={photoUri ?? photoUrl} onChange={(u) => { setPhotoUri(u); if (!u) setPhotoUrl(null); }} />
            </View>
            {isSighting ? null : <TextField label="Pet's name" placeholder="Max" value={name} onChangeText={setName} />}
            <Chips label="Type" options={SPECIES} value={species} onChange={(s) => { const b = breedById(breed.id); if (b?.species && b.species !== s) setBreed(EMPTY_BREED); setSpecies(s); }} />
            <BreedPicker optional species={species} value={breed} onChange={setBreed} />
            {isSighting ? <View style={{ gap: 8 }}><Text style={styles.label}>Condition</Text><ConditionGrid value={condition} onChange={setCondition} /></View> : null}
            <TextField label={isSighting ? "Description (optional)" : "Distinctive features (optional)"} placeholder={isSighting ? "No collar, white paws, very friendly" : "Blue collar, limps on left leg"} value={features} onChangeText={setFeatures} multiline />
            <View style={{ gap: 8 }}>
              <Text style={styles.label}>{isSighting ? "Where you saw them" : "Last seen"}</Text>
              <LocationPicker
                value={keepLocation ? (existingLabel ? { label: existingLabel, lat: 0, lng: 0 } : null) : place}
                onChange={(p) => { setKeepLocation(false); setPlace(p); }}
                city={city} center={center} />
            </View>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <Primary label={saving ? "Saving…" : "Save changes"} onPress={save} disabled={!valid || saving} />
          </View>
        </>
      )}
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
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.white },
});
