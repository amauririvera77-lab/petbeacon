import { router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { MatchesSheet } from "../components/MatchesSheet";
import { PetPhotoActions, PetPhotoImage } from "../components/pet/PetPhoto";
import { RemovePetSheet } from "../components/pet/RemovePetSheet";
import { PinDetailSheet } from "../components/PinDetailSheet";
import { Primary } from "../components/Primary";
import { TextField } from "../components/TextField";
import { BreedPicker } from "../components/report/BreedPicker";
import { Chips } from "../components/report/Chips";
import { useHome } from "../hooks/useHome";
import { useMyMatches } from "../hooks/useMyMatches";
import { useMyReports } from "../hooks/useMyReports";
import { EMPTY_BREED, breedById, breedDisplay, breedValueFrom, sizeFromBreed, type BreedValue } from "../lib/breeds";
import type { MyMatch, Pet, PetSize, ReportNearby, Species } from "../lib/database.types";
import { maskMicrochip, validateMicrochip } from "../lib/microchip";
import { COLOR_OPTIONS, SIZE_OPTIONS, choiceToColor, colorLabel, colorToChoice, sizeLabel, type ColorChoice } from "../lib/petOptions";
import { petState } from "../lib/petStatus";
import { archivePet, savePet } from "../lib/pets";
import { fetchReportNearby } from "../lib/reportLookup";
import { supabase } from "../lib/supabase";
import { agoShort, elapsedShort } from "../lib/time";
import { useSession } from "../state/session";
import { Theme, MIN_HIT, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

const SPECIES = [{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }, { value: "other", label: "Other" }] as const;

type Form = {
  name: string; species: Species | null; breed: BreedValue; colorChoice: ColorChoice | null; colorOther: string;
  size: PetSize | null; features: string; microchip: string; photoUri: string | null; photoUrl: string | null;
  photoFocusX: number | null; photoFocusY: number | null; // de la mascota ya guardada; una foto nueva (photoUri) no tiene foco propio aún
};
const EMPTY: Form = {
  name: "", species: null, breed: EMPTY_BREED, colorChoice: null, colorOther: "", size: null, features: "", microchip: "",
  photoUri: null, photoUrl: null, photoFocusX: null, photoFocusY: null,
};

// Pet profile (Fase 12 de congelación): modo VISTA por defecto al entrar a una mascota ya existente — foto, nombre,
// tarjeta de estado (si tiene reporte activo) y una ficha de solo lectura ("Details"). "Edit details" lleva al modo
// EDICIÓN, que es el formulario de siempre. Una mascota nueva no tiene nada que ver todavía: entra directo en edición.
export default function PetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = !id || id === "new";
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { name: userName, city, alertRadiusMi, home } = useSession();
  const center = useHome();
  const { reports: myReports, refresh: refreshMine, markReunited } = useMyReports();
  const { matches, dismiss, restore } = useMyMatches();

  const [mode, setMode] = useState<"view" | "edit">(isNew ? "edit" : "view");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [detail, setDetail] = useState<ReportNearby | null>(null);
  const [sheetFor, setSheetFor] = useState<{ id: string; name: string } | null>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [initial, setInitial] = useState<Form>(EMPTY);
  const [microchipError, setMicrochipError] = useState<string | null>(null);
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
        photoFocusX: p.photo_focus_x, photoFocusY: p.photo_focus_y,
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

  // "Cancel" (modo edición): es un cambio de pantalla LOCAL (vista↔edición), no una navegación — el listener de arriba
  // no se entera, así que el mismo diálogo de "Discard changes?" vive aquí también.
  const cancelEdit = () => {
    if (!dirty) { setMode("view"); return; }
    Alert.alert("Discard changes?", "You have changes that haven't been saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => { setF(initial); setMicrochipError(null); setMode("view"); } },
    ]);
  };

  const save = async () => {
    if (!valid || !f.species) return;
    const chip = validateMicrochip(f.microchip);
    if (!chip.ok) { setMicrochipError(chip.error); return; }
    setSaving(true);
    try {
      const saved = await savePet(isNew ? null : id, {
        name: f.name, species: f.species, breed: f.breed.text || null, breedId: f.breed.id,
        color: choiceToColor(f.colorChoice, f.colorOther), size: f.size, features: f.features, microchip: chip.value,
        photoUri: f.photoUri, photoUrl: f.photoUrl,
      }, profile);
      if (isNew) {
        // Mascota nueva: a su propio modo vista, no de vuelta a Profile — replace para que "atrás" lleve a Profile
        // y no al formulario vacío que se acaba de dejar (Fase 12 de congelación).
        allowExit.current = true;
        router.replace({ pathname: "/pet", params: { id: saved.id } });
      } else {
        const c = colorToChoice(saved.color);
        const loaded: Form = {
          name: saved.name, species: saved.species, breed: breedValueFrom(saved.breed_id, saved.breed, saved.species),
          colorChoice: c.choice, colorOther: c.other, size: saved.size, features: saved.features ?? "", microchip: saved.microchip ?? "",
          photoUri: null, photoUrl: saved.photo_url, photoFocusX: saved.photo_focus_x, photoFocusY: saved.photo_focus_y,
        };
        setF(loaded); setInitial(loaded); setMode("view");
      }
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
  // "Review matches" (PinDetailSheet, modo dueño): misma jerarquía que My Reports.
  const viewSighting = async (m: MyMatch) => {
    const r = await fetchReportNearby(m.sighted_report_id, center.lat, center.lng);
    setSheetFor(null);
    if (r) setTimeout(() => setDetail(r), 400);
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

  const colorText = colorLabel(choiceToColor(f.colorChoice, f.colorOther));
  const breedText = breedDisplay(f.breed);
  const viewSubtitle = [breedText, sizeLabel(f.size), colorText].filter(Boolean).join(" · ") || null;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={Theme.text.primary} /></Pressable>
        {/* Modo vista: solo el botón de volver, sin título (Fase 12 de congelación) — el nombre ya está grande debajo de la foto. */}
        {mode === "edit" ? <AppText role="title" style={styles.h} accessibilityRole="header" numberOfLines={1}>{isNew ? "Add pet" : `Edit ${f.name.trim() || "pet"}`}</AppText> : null}
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={Theme.brand.primary} /></View> : mode === "view" ? (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 32 }}>
          <PetPhotoImage uri={f.photoUri ?? f.photoUrl} focusX={f.photoUri ? null : f.photoFocusX} focusY={f.photoUri ? null : f.photoFocusY} />
          <View style={{ gap: 4 }}>
            <AppText role="title" style={styles.viewName}>{f.name.trim() || "Unnamed pet"}</AppText>
            {viewSubtitle ? <AppText style={styles.viewSubtitle}>{viewSubtitle}</AppText> : null}
          </View>

          {status.state === "lost" ? (
            <View style={styles.stateBox}>
              <View style={styles.stateRow}>
                <Badge status="lost" />
                <AppText style={styles.stateT}>Missing for {elapsedShort(status.report.created_at)}</AppText>
              </View>
              <Button label="View report" variant="secondary" onPress={viewReport} />
            </View>
          ) : status.state === "reunited" ? (
            <View style={styles.stateBox}>
              <View style={styles.stateRow}>
                <Badge status="reunited" />
                <AppText style={styles.stateT}>{agoShort(status.report.reunited_at ?? status.report.created_at)}</AppText>
              </View>
            </View>
          ) : (
            // Secundario a propósito (confirmado con el usuario): "Report lost" no es la acción PRINCIPAL de esta
            // pantalla (es el modo vista de una mascota EN CASA, sin nada urgente pasando) — primaryLost/coral se
            // reserva para cuando reportar perdido sí es la única acción posible (p. ej. Welcome del onboarding).
            <Button label="Report lost" variant="secondary" onPress={() => router.push({ pathname: "/report/lost", params: { petId: id } })} />
          )}

          <View>
            <AppText style={styles.sec}>Details</AppText>
            <View style={styles.card}>
              <DetailRow label="Type" value={SPECIES.find((s) => s.value === f.species)?.label ?? "Not added yet"} empty={!f.species} />
              <View style={styles.divider}><DetailRow label="Breed" value={breedText || "Not added yet"} empty={!breedText} /></View>
              <View style={styles.divider}><DetailRow label="Main color" value={colorText || "Not added yet"} empty={!colorText} /></View>
              <View style={styles.divider}><DetailRow label="Size" value={sizeLabel(f.size) || "Not added yet"} empty={!sizeLabel(f.size)} /></View>
              <View style={styles.divider}><DetailRow label="Distinctive features" value={f.features.trim() || "Not added yet"} empty={!f.features.trim()} /></View>
              <View style={styles.divider}>
                <DetailRow label="Microchip" value={f.microchip ? maskMicrochip(f.microchip) : "Not added yet"} empty={!f.microchip}
                  note={f.microchip ? "Only you can see this." : undefined} />
              </View>
            </View>
          </View>

          <Button variant="secondary" label="Edit details" onPress={() => setMode("edit")} />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          {/* Orden (evaluación UX): imagen → Change/Remove photo → resto del formulario. El bloque de estado y "Report lost" ahora
              viven en el modo vista (Fase 12 de congelación) — editar datos y revisar el estado del reporte son cosas distintas. */}
          {/* Una foto recién elegida (photoUri) todavía no tiene foco propio — centro por defecto hasta guardarla y que el backend le calcule uno. */}
          <PetPhotoImage uri={f.photoUri ?? f.photoUrl} focusX={f.photoUri ? null : f.photoFocusX} focusY={f.photoUri ? null : f.photoFocusY} />
          <PetPhotoActions uri={f.photoUri ?? f.photoUrl} petName={f.name} onChange={(u) => set({ photoUri: u, photoUrl: u ? f.photoUrl : null })} />

          <TextField label="Pet's name" placeholder="Max" value={f.name} onChangeText={(name) => set({ name })} />
          <Chips label="Type" options={SPECIES} value={f.species} onChange={onSpecies} />
          {/* Al elegir una raza real se preselecciona el tamaño típico (breed_sizes); el usuario lo puede cambiar. "Mixed / Not sure",
              "Other" o una raza sin peso (gatos) no tocan el tamaño ya elegido. */}
          <BreedPicker species={f.species} value={f.breed} onChange={(breed) => set({ breed, size: sizeFromBreed(breed.id) ?? f.size })} />

          <Chips label="Main color" options={COLOR_OPTIONS} value={f.colorChoice} onChange={(colorChoice) => set({ colorChoice })} />
          {f.colorChoice === "other" ? <TextField label="Describe the color" placeholder="Brindle" value={f.colorOther} onChangeText={(colorOther) => set({ colorOther })} maxLength={30} /> : null}
          <Chips label="Size" options={SIZE_OPTIONS} value={f.size} onChange={(size) => set({ size })} />
          <View style={{ gap: 6 }}>
            <TextField label="Distinctive features" labelSuffix="(optional)" placeholder="Blue collar, white paws, scar on left ear" value={f.features} onChangeText={(features) => set({ features })} multiline maxLength={100} />
            <AppText style={styles.counter}>{f.features.length}/100</AppText>
          </View>
          <TextField label="Microchip number" labelSuffix="(optional)" placeholder="9, 10 or 15 characters" value={f.microchip}
            onChangeText={(microchip) => { set({ microchip }); setMicrochipError(null); }}
            autoCapitalize="characters" autoCorrect={false} maxLength={20}
            helper={microchipError ?? "Only you can see this. It's never shown publicly."} />

          <Primary label={saving ? "Saving…" : isNew ? "Add pet" : "Save changes"} onPress={save} disabled={!valid || saving || (!isNew && !dirty)} />
          {!isNew ? <Button variant="secondary" label="Cancel" onPress={cancelEdit} disabled={saving} /> : null}
          {!isNew ? <Pressable accessibilityRole="button" onPress={() => setRemoveOpen(true)} style={styles.remove}><AppText style={styles.removeT}>Remove from my pets</AppText></Pressable> : null}
        </ScrollView>
      )}
      <RemovePetSheet visible={removeOpen} petName={f.name} hasActiveReport={status.state === "lost"} busy={removing} onClose={() => setRemoveOpen(false)} onConfirm={remove} />
      <PinDetailSheet report={detail} mine onClose={() => setDetail(null)}
        onMarkReunited={async (r) => { try { await markReunited(r.id); refreshMine(); } catch (e) { Alert.alert("Couldn't update your report", e instanceof Error ? e.message : "Please try again."); } }}
        matchCount={detail ? matches.filter((m) => m.lost_report_id === detail.id && !m.dismissed).length : undefined}
        onReviewMatches={(r) => { setDetail(null); setTimeout(() => setSheetFor({ id: r.id, name: r.name ?? "your pet" }), 400); }} />
      <MatchesSheet lostName={sheetFor?.name ?? ""} matches={sheetFor ? matches.filter((m) => m.lost_report_id === sheetFor.id) : null}
        onClose={() => setSheetFor(null)} onView={viewSighting} onDismiss={dismiss} onRestore={restore} />
    </KeyboardAvoidingView>
  );
}

// Fila de solo lectura de "Details" (modo vista, Fase 12 de congelación): etiqueta Body/14 text/secondary a la
// izquierda, valor Label/14 text/primary a la derecha (Fase 10) — text/muted si el campo está vacío ("Not added yet").
function DetailRow({ label, value, empty, note }: { label: string; value: string; empty?: boolean; note?: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText style={styles.detailLabel}>{label}</AppText>
      <View style={{ flex: 1, alignItems: "flex-end" }}>
        <AppText style={[styles.detailValue, empty && { color: Theme.text.muted }]} numberOfLines={1}>{value}</AppText>
        {note ? <AppText style={styles.detailNote}>{note}</AppText> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.surface.card },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  // Título de pantalla (variant="title" implícito): el contenido es el nombre de la mascota, pero el ROL es título de
  // pantalla secundaria — Title/24 como el resto, no Heading/20 (CLAUDE.md, "el rol manda sobre el contenido").
  h: { flex: 1, ...typography.title24, color: Theme.text.primary },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  counter: { ...typography.caption12, color: Theme.text.muted, textAlign: "right" },
  stateBox: { gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.page },
  stateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stateT: { flex: 1, ...typography.label14, color: Theme.text.primary },
  remove: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  removeT: { ...typography.label14, color: Theme.danger.text, textDecorationLine: "underline" },
  // Modo vista: nombre en Title/24 (rol de título de pantalla secundaria, igual que el header en modo edición — "el
  // rol manda sobre el contenido") y debajo "Pekingese · Small · Cream" en Body/14 text/secondary.
  viewName: { ...typography.title24, color: Theme.text.primary },
  viewSubtitle: { ...typography.body14, color: Theme.text.secondary },
  // "DETAILS": Label/13 mayúsculas, text/secondary (Fase 10 de congelación).
  sec: { ...typography.label13, letterSpacing: 0.72, textTransform: "uppercase", color: Theme.text.secondary, marginBottom: 12 },
  card: { borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default, overflow: "hidden" },
  divider: { borderTopWidth: 1, borderTopColor: Theme.border.default },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  detailLabel: { ...typography.body14, color: Theme.text.secondary },
  detailValue: { ...typography.label14, color: Theme.text.primary },
  detailNote: { ...typography.caption12, color: Theme.text.muted, marginTop: 2 },
});
