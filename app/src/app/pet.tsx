import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Primary } from "../components/Primary";
import { TextField } from "../components/TextField";
import { Chips } from "../components/report/Chips";
import { PhotoPicker } from "../components/report/PhotoPicker";
import type { Pet, Species } from "../lib/database.types";
import { removePet, savePet } from "../lib/pets";
import { supabase } from "../lib/supabase";
import { useSession } from "../state/session";
import { C, MIN_HIT, font } from "../theme/tokens";

const SPECIES = [{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }, { value: "other", label: "Other" }] as const;

// Pet profile: foto, nombre, tipo, raza. Acciones: "Report lost" (prellena el flujo), "Save changes", "Remove pet".
export default function PetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";
  const insets = useSafeAreaInsets();
  const { name: userName, city, alertRadiusMi, home } = useSession();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<Species | null>(null);
  const [breed, setBreed] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null); // foto local nueva (se sube al guardar)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // foto ya guardada

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

  const confirmRemove = () =>
    Alert.alert("Remove this pet?", "This removes it from your registered pets. Reports you already published stay active.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removePet(id).then(() => router.back()).catch((e) => Alert.alert("Couldn't remove", e.message)) },
    ]);

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
          <TextField label="Pet's name" placeholder="Max" value={name} onChangeText={setName} />
          <Chips label="Type" options={SPECIES} value={species} onChange={setSpecies} />
          <TextField label="Breed" placeholder="Golden Retriever" value={breed} onChangeText={setBreed} />

          <View style={{ gap: 10, marginTop: 8 }}>
            {!isNew ? <Button label="Report lost" variant="primaryLost" onPress={() => router.push({ pathname: "/report/lost", params: { petId: id } })} /> : null}
            <Primary label={saving ? "Saving…" : isNew ? "Add pet" : "Save changes"} onPress={save} disabled={!valid || saving} />
            {!isNew ? <Pressable accessibilityRole="button" onPress={confirmRemove} style={styles.remove}><Text style={styles.removeT}>Remove pet</Text></Pressable> : null}
          </View>
        </ScrollView>
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
  remove: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  removeT: { fontFamily: font.bodyBold, fontSize: 15, color: C.sosDark },
});
