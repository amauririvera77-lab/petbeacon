import { router, useLocalSearchParams } from "expo-router";
import { ChevronRight, Dog, Mail, MapPin, Phone, Plus, Share2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { FLYERS_READY } from "../../lib/flyer";
import { Place } from "../../lib/geocode";
import { reportShareText } from "../../lib/shareText";
import { publishReport } from "../../lib/publish";
import { supabase } from "../../lib/supabase";
import { validateContact } from "../../lib/validation";
import type { Species } from "../../lib/database.types";
import { useHome } from "../../hooks/useHome";
import { useMyReports } from "../../hooks/useMyReports";
import { usePets } from "../../hooks/usePets";
import { petsAtHome } from "../../lib/petStatus";
import { useHomePrefs } from "../../state/homePrefs";
import { useSession } from "../../state/session";
import { C, font, radius } from "../../theme/tokens";
import { Cta } from "../Cta";
import { FocusImage } from "../FocusImage";
import { SpeciesPlaceholder } from "../SpeciesPlaceholder";
import { useSnackbar } from "../Snackbar";
import { TextField } from "../TextField";
import { ConditionGrid, TypeButtons, type Condition } from "../flow/OptionButtons";
import { PhotoDropzone } from "../flow/PhotoDropzone";
import { FlowHeader } from "../layout/Headers";
import { ScreenLayout } from "../layout/ScreenLayout";
import { SuccessBlock, successText } from "../layout/Success";
import { LocationPicker } from "./LocationPicker";

type Kind = "lost" | "sighted";
type Step = "photo" | "details" | "where" | "review" | "done";

const SPECIES_LABEL = { dog: "Dog", cat: "Cat", other: "Other" } as const;

// Lost:    foto → detalles → ubicación + contacto (obligatorio) → revisión → confirmación (§2)
// Sighted: foto → ubicación → condición + contacto (opcional)  → confirmación
const ORDER: Record<Kind, Step[]> = {
  lost: ["photo", "details", "where", "review", "done"],
  sighted: ["photo", "where", "details", "done"],
};

export function ReportFlow({ kind }: { kind: Kind }) {
  const { name: userName, city, alertRadiusMi, home } = useSession();
  const { setView } = useHomePrefs();
  // "View on List": la Home se abre SIEMPRE en List, aunque el usuario la hubiera dejado en Map.
  const viewOnList = () => { setView("list"); router.dismissTo("/(tabs)"); };
  const center = useHome();
  const steps = ORDER[kind];
  const [i, setI] = useState(0);
  const step = steps[i];

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [petPhotoUrl, setPetPhotoUrl] = useState<string | null>(null); // foto de la mascota registrada (ya subida)
  const [petName, setPetName] = useState("");
  const { species: speciesParam, petId: petIdParam } = useLocalSearchParams<{ species?: string; petId?: string }>();
  const [petId, setPetId] = useState<string | undefined>(petIdParam);
  const snackbar = useSnackbar();
  // "Which pet is missing?" (desde el FAB): si el usuario tiene mascotas en estado Home, el primer paso le deja elegir una o "Another pet".
  const [chooserDone, setChooserDone] = useState(false);
  const { pets, loading: petsLoading } = usePets();
  const { reports: myReports, loading: mineLoading } = useMyReports();
  const homePets = useMemo(() => petsAtHome(pets, myReports), [pets, myReports]);
  const [species, setSpecies] = useState<Species | null>(speciesParam === "dog" || speciesParam === "cat" || speciesParam === "other" ? speciesParam : null);
  const [breed, setBreed] = useState("");
  const [features, setFeatures] = useState("");
  const [condition, setCondition] = useState<Condition | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  // "Report lost" desde Pet profile: prellena nombre, tipo, raza y foto de la mascota registrada y, como esos pasos ya
  // están completos, arranca directo en "Where did you last see them?". Con "Back" se puede volver a editarlos.
  const [petLoading, setPetLoading] = useState(!!petIdParam);
  useEffect(() => {
    if (!petId || !supabase) { setPetLoading(false); return; }
    setPetLoading(true);
    // Una mascota solo puede tener un Lost activo (también lo impone la base): si ya lo tiene, no se abre el flujo.
    if (kind === "lost") {
      supabase.from("reports").select("id").eq("pet_id", petId).eq("status", "lost").limit(1).then(({ data: act }) => {
        if (act && act.length > 0) Alert.alert("Already reported", "This pet already has an active Lost report.", [{ text: "OK", onPress: () => router.back() }]);
      });
    }
    supabase.from("pets").select("name,species,breed,photo_url").eq("id", petId).maybeSingle().then(({ data }) => {
      if (data) {
        setPetName(data.name); setSpecies(data.species as Species); setBreed(data.breed ?? ""); setPetPhotoUrl(data.photo_url);
        if (kind === "lost" && data.name?.trim() && data.species) setI(ORDER.lost.indexOf("where"));
      }
      setPetLoading(false);
    });
  }, [petId, kind]);

  const isLost = kind === "lost";
  const tone = isLost ? "lost" : "sighted";
  const close = () => router.back();
  // Back del encabezado (prototipo): en el primer paso y en la confirmación cierra el flujo; en el resto vuelve un paso.
  const back = i > 0 && step !== "done" ? () => setI(i - 1) : close;
  const next = () => setI(i + 1);

  const checkContact = () => {
    const r = validateContact(contact, { required: isLost });
    setContactError(r.ok ? null : r.error);
    return r;
  };

  const publish = async () => {
    const c = checkContact();
    if (!c.ok || !place || !species) return;
    setPublishing(true);
    try {
      const { id, petCreated } = await publishReport({
        status: kind,
        species,
        name: isLost ? petName.trim() : null,
        breed: breed.trim() || null,
        features: features.trim() || null,
        condition: !isLost ? condition : null,
        contact: c.value,
        location: place,
        photoUri,
        photoUrl: petPhotoUrl,
        petId: petId ?? null,
        profile: { name: userName, city, alertRadiusMi, home },
      });
      if (petCreated) snackbar.show({ message: `${petName.trim() || "Your pet"} was added to your pets` });
      setPublishedId(id);
      setI(steps.indexOf("done"));
    } catch (e) {
      Alert.alert("We couldn't publish your report", e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const chooserActive = kind === "lost" && !petIdParam && !petId && !chooserDone;
  if (petLoading || (chooserActive && (petsLoading || mineLoading))) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.white }}><ActivityIndicator color={C.teal} /></View>;
  }

  // ── Encabezado (prototipo) ──────────────────────────────────────────────────────────────────────────────────────
  // Lost: fila Back · título · "n/3" siempre visible; las 3 barras solo en los pasos 1–3. Sighted: todo el encabezado solo en 1–3.
  const n = i + 1;
  const accent = isLost ? C.sos : C.warn;
  const inSteps = n <= 3;
  const header = (
    <FlowHeader title={isLost ? "Report lost pet" : "Report a sighting"} step={n} accent={accent} onBack={back}
      showRow={isLost ? true : inSteps} showBars={inSteps} />
  );
  const pad = { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 } as const;
  const publishGuard = () => { if (!publishing) publish(); };

  if (chooserActive && homePets.length > 0) {
    return (
      <ScreenLayout header={<FlowHeader title="Report lost pet" step={1} accent={accent} onBack={close} showBars={false} showCount={false} />} contentStyle={pad}>
        <Text style={[st.h2, { marginBottom: 8 }]}>Which pet is missing?</Text>
        <Text style={[st.sub, { marginBottom: 24 }]}>Pick one of your pets and we'll fill in the details for you.</Text>
        <View style={{ gap: 10 }}>
          {homePets.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => setPetId(p.id)} style={({ pressed }) => [st.petPick, pressed && { backgroundColor: C.surface }]}>
              {p.photo_url ? <FocusImage uri={p.photo_url} style={st.petThumb} /> : <SpeciesPlaceholder species={p.species} size={48} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={st.petPickName} numberOfLines={1}>{p.name}</Text>
                {p.breed ? <Text style={st.petPickBreed} numberOfLines={1}>{p.breed}</Text> : null}
              </View>
              <ChevronRight size={18} color={C.slate500} />
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={() => setChooserDone(true)} style={({ pressed }) => [st.petPick, st.petPickDashed, pressed && { backgroundColor: C.surface }]}>
            <View style={[st.petThumb, { alignItems: "center", justifyContent: "center" }]}><Plus size={22} color={C.slate700} /></View>
            <Text style={[st.petPickName, { flex: 1, color: C.slate700 }]}>Another pet</Text>
          </Pressable>
        </View>
      </ScreenLayout>
    );
  }

  if (step === "photo") {
    return (
      <ScreenLayout header={header} contentStyle={pad} cta={<Cta label="Continue" tone={tone} onPress={next} />}>
        <Text style={[st.h2, { marginBottom: 8 }]}>{isLost ? "Add a photo of your pet" : "Snap a quick photo"}</Text>
        <Text style={st.sub}>{isLost ? "Helps others recognize them fast. You can skip this." : "Optional, but it helps the owner confirm it's their pet."}</Text>
        <PhotoDropzone uri={photoUri ?? petPhotoUrl} onChange={(u) => { setPhotoUri(u); if (!u) setPetPhotoUrl(null); }} />
      </ScreenLayout>
    );
  }

  if (isLost && step === "details") {
    return (
      <ScreenLayout header={header} contentStyle={pad} cta={<Cta label="Continue" tone={tone} onPress={next} disabled={!petName.trim() || !species} />}>
        <Text style={[st.h2, { marginBottom: 24 }]}>Tell us about your pet</Text>
        <View style={st.field}><TextField variant="form" label="Pet's name" placeholder="Max" value={petName} onChangeText={setPetName} /></View>
        <Text style={st.label}>Type</Text>
        <View style={st.field}><TypeButtons value={species} onChange={setSpecies} /></View>
        <View style={st.field}><TextField variant="form" label="Breed" labelSuffix="(optional)" placeholder="Golden Retriever" value={breed} onChangeText={setBreed} /></View>
        <TextField variant="form" label="Distinctive features" labelSuffix="(optional)" placeholder="Blue collar, limps on left leg"
          value={features} onChangeText={setFeatures} multiline maxLength={100} />
        <Text style={st.counter}>{features.length}/100</Text>
      </ScreenLayout>
    );
  }

  if (step === "where") {
    return (
      <ScreenLayout header={header} contentStyle={pad}
        cta={<Cta label={isLost ? "Review & publish" : "Continue"} tone={tone} disabled={!place || (isLost && !contact.trim())}
          onPress={() => { if (isLost && !checkContact().ok) return; next(); }} />}>
        <Text style={[st.h2, { marginBottom: 8 }]}>{isLost ? "Where did you last see them?" : "Confirm the exact spot"}</Text>
        <Text style={st.sub}>{isLost ? "Use your location or enter the spot manually." : "Use your current location or enter the spot manually."}</Text>
        <LocationPicker variant="flow" value={place} onChange={setPlace} city={city} center={center} />
        {isLost ? (
          <View style={{ marginTop: 24 }}>
            <TextField variant="ds" label="Phone or email" placeholder="(914) 555-0142 or you@email.com" value={contact}
              onChangeText={(t) => { setContact(t); setContactError(null); }} onBlur={() => contact.trim() && checkContact()}
              keyboardType="email-address" autoCapitalize="none" autoComplete="off"
              helper="This appears on your flyer so people can reach you directly." error={contactError ?? undefined} />
          </View>
        ) : null}
      </ScreenLayout>
    );
  }

  if (!isLost && step === "details") {
    return (
      <ScreenLayout header={header} contentStyle={pad}
        cta={<Cta label={publishing ? "Submitting…" : "Submit sighting"} tone={tone} loading={publishing} disabled={!species || !condition || !place} onPress={publishGuard} />}>
        <Text style={[st.h2, { marginBottom: 24 }]}>How do they seem?</Text>
        {/* "Type" no está en el prototipo, pero el matching exige especie exacta: se conserva con el mismo estilo de botones. */}
        <Text style={st.label}>Type</Text>
        <View style={st.field}><TypeButtons value={species} onChange={setSpecies} /></View>
        <View style={{ marginBottom: 32 }}><ConditionGrid value={condition} onChange={setCondition} /></View>
        <View style={st.field}>
          <TextField variant="form" label="Breed or description" labelSuffix="(optional)" placeholder="Beagle mix, no collar" value={features} onChangeText={setFeatures} multiline />
        </View>
        <Text style={st.label}>Want updates on this pet? <Text style={st.optional}>(optional)</Text></Text>
        <View style={[st.iconField, !!contactError && { borderColor: C.sosDark }]}>
          <Mail size={18} color={C.slate500} />
          <TextInput value={contact} onChangeText={(t) => { setContact(t); setContactError(null); }} placeholder="Phone or email" placeholderTextColor={C.slate500}
            accessibilityLabel="Phone or email" keyboardType="email-address" autoCapitalize="none" autoComplete="off" style={st.iconInput} />
        </View>
        <Text style={[st.help, !!contactError && { color: C.sosDark }]}>{contactError ?? "No account needed — this just lets us notify you if there's a match."}</Text>
      </ScreenLayout>
    );
  }

  if (isLost && step === "review") {
    const photo = photoUri ?? petPhotoUrl;
    return (
      <ScreenLayout header={header} contentStyle={pad}
        cta={<Cta label={publishing ? "Publishing…" : "Publish alert"} tone="lost" loading={publishing} onPress={publishGuard} />}>
        <Text style={[st.h2, { marginBottom: 24 }]}>Review alert</Text>
        <View style={st.reviewTop}>
          <View style={st.thumb}>{photo ? <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <Dog size={30} color={C.slate500} />}</View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={st.rName}>{petName || "Unnamed pet"}</Text>
            <Text style={st.rType}>{species ? SPECIES_LABEL[species] : "Type not set"}</Text>
            {features ? <Text style={st.rFeat}>{features}</Text> : null}
          </View>
        </View>
        <View style={[st.rRow, { marginBottom: 12 }]}><MapPin size={16} color={C.sos} /><Text style={st.rRowT}>{place?.label ?? ""}</Text></View>
        <View style={[st.rRow, { marginBottom: 24 }]}><Phone size={16} color={C.sos} /><Text style={st.rRowT}>{contact}</Text></View>
        <View style={st.warnBox}><Text style={st.warnT}>This publishes immediately and notifies nearby users. You can edit or delete it later.</Text></View>
      </ScreenLayout>
    );
  }

  // done — círculo con ícono ARRIBA → título → texto de apoyo → botones (SuccessBlock). "Share flyer/sighting" genera la imagen real.
  const goFlyer = () => publishedId && router.push({ pathname: "/flyer", params: { id: publishedId } });
  // "Share alert": compartir texto con la hoja nativa. Es la acción de compartir mientras el flyer (imagen) no esté verificado (FLYERS_READY):
  // estas pantallas nunca se quedan sin una forma de compartir.
  const shareAlert = () => {
    if (!publishedId || !species) return;
    Share.share({ message: reportShareText({
      id: publishedId, status: kind, species, name: isLost ? petName.trim() || null : null, breed: breed.trim() || null,
      features_description: features.trim() || null, location_label: place?.label ?? null, created_at: new Date().toISOString(),
    }) }).catch(() => Alert.alert("Couldn't open sharing"));
  };
  const supportLink = (
    <Pressable accessibilityRole="button" onPress={() => router.dismissTo("/(tabs)/support")} style={st.supportLink}>
      <Text style={st.supportT}>Pet care can get expensive. Free local resources</Text>
      <ChevronRight size={14} color={C.slate500} />
    </Pressable>
  );
  return (
    <ScreenLayout header={header}>
      {isLost ? (
        <SuccessBlock title="Your alert is live">
          <Text style={[successText.p, { marginBottom: 8 }]}>{"Nearby users have been notified.\nWe'll alert you the moment there's a match."}</Text>
          <Text style={[successText.strong, { marginBottom: 24 }]}>{"Share this with your neighborhood\nto reach more people"}</Text>
          <View style={st.fullW}>
            <Cta label={FLYERS_READY ? "Share flyer" : "Share alert"} tone="lost" icon={<Share2 size={18} color={C.white} />} disabled={!publishedId} onPress={FLYERS_READY ? goFlyer : shareAlert} />
            <Pressable accessibilityRole="button" onPress={() => viewOnList()} style={st.textBtn}><Text style={st.textBtnT}>View on List</Text></Pressable>
            {supportLink}
          </View>
        </SuccessBlock>
      ) : (
        <SuccessBlock title="Thanks for helping">
          <Text style={[successText.p, { marginBottom: 24 }]}>Your sighting has been posted to the map.</Text>
          <View style={st.fullW}>
            <Pressable accessibilityRole="button" onPress={FLYERS_READY ? goFlyer : shareAlert} disabled={!publishedId} style={[st.outlineBtn, !publishedId && { opacity: 0.5 }]}>
              <Share2 size={16} color={C.ink} /><Text style={st.outlineT}>{FLYERS_READY ? "Share sighting" : "Share alert"}</Text>
            </Pressable>
            <Cta label="View on List" tone="sighted" onPress={() => viewOnList()} />
            {supportLink}
          </View>
        </SuccessBlock>
      )}
    </ScreenLayout>
  );
}

// Estilos del prototipo: h2 24/1.2 (Geist 600), subtítulo 14/1.5, etiquetas 13/700, contador 12.
const st = StyleSheet.create({
  petPick: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  petPickDashed: { borderStyle: "dashed", borderColor: C.border2 },
  petThumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: C.surface, overflow: "hidden" },
  petPickName: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  petPickBreed: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
  h2: { fontFamily: font.displayMedium, fontSize: 24, lineHeight: 28.8, letterSpacing: -0.24, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 21, color: C.slate600, marginBottom: 24 },
  label: { fontFamily: font.bodyBold, fontSize: 13, color: C.slate700, marginBottom: 8 },
  optional: { fontFamily: font.body, color: C.slate500 },
  field: { marginBottom: 24 },
  counter: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500, textAlign: "right", marginTop: 8 },
  iconField: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, marginBottom: 8 },
  iconInput: { flex: 1, fontFamily: font.body, fontSize: 16, color: C.ink },
  help: { fontFamily: font.bodyRegular, fontSize: 12, lineHeight: 18, color: C.slate500 },
  reviewTop: { flexDirection: "row", gap: 16, marginBottom: 24 },
  thumb: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: "#F1F5F9", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  rName: { fontFamily: font.head, fontSize: 20, color: C.ink, marginBottom: 4 },
  rType: { fontFamily: font.bodyRegular, fontSize: 14, color: C.slate600 },
  rFeat: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 18, color: C.slate500, marginTop: 4 },
  rRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rRowT: { flex: 1, fontFamily: font.bodySemi, fontSize: 14, color: C.ink },
  warnBox: { backgroundColor: C.sosTint, borderWidth: 1, borderColor: C.sosBorder, borderRadius: radius.md, padding: 16 },
  warnT: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19.5, color: C.sosInk },
  fullW: { width: "100%", alignItems: "center" },
  textBtn: { height: 48, paddingHorizontal: 16, justifyContent: "center" },
  textBtnT: { fontFamily: font.bodyBold, fontSize: 15, color: C.slate600 },
  outlineBtn: { width: "100%", height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  outlineT: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  supportLink: { height: 40, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, marginTop: 8 },
  supportT: { fontFamily: font.body, fontSize: 13, color: C.slate500 },
});
