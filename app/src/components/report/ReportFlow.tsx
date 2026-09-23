import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { Place } from "../../lib/geocode";
import { publishReport } from "../../lib/publish";
import { validateContact } from "../../lib/validation";
import type { Species } from "../../lib/database.types";
import { useHome } from "../../hooks/useHome";
import { useSession } from "../../state/session";
import { C, font, radius } from "../../theme/tokens";
import { TextField } from "../TextField";
import { Chips } from "./Chips";
import { LocationPicker } from "./LocationPicker";
import { PhotoPicker } from "./PhotoPicker";
import { StepShell } from "./StepShell";

type Kind = "lost" | "sighted";
type Step = "photo" | "details" | "where" | "review" | "done";
type Condition = "calm" | "scared" | "injured" | "unsure";

const SPECIES = [{ value: "dog", label: "Dog" }, { value: "cat", label: "Cat" }, { value: "other", label: "Other" }] as const;
const CONDITIONS = [{ value: "calm", label: "Calm" }, { value: "scared", label: "Scared" }, { value: "injured", label: "Injured" }, { value: "unsure", label: "Not sure" }] as const;

// Lost:    foto → detalles → ubicación + contacto (obligatorio) → revisión → confirmación (§2)
// Sighted: foto → ubicación → condición + contacto (opcional)  → confirmación
const ORDER: Record<Kind, Step[]> = {
  lost: ["photo", "details", "where", "review", "done"],
  sighted: ["photo", "where", "details", "done"],
};

export function ReportFlow({ kind }: { kind: Kind }) {
  const { name: userName, city, alertRadiusMi, home } = useSession();
  const center = useHome();
  const steps = ORDER[kind];
  const [i, setI] = useState(0);
  const step = steps[i];
  const total = steps.length - 1; // la confirmación no cuenta como paso

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [species, setSpecies] = useState<Species | null>(null);
  const [breed, setBreed] = useState("");
  const [features, setFeatures] = useState("");
  const [condition, setCondition] = useState<Condition | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const isLost = kind === "lost";
  const tone = isLost ? "lost" : "sighted";
  const close = () => router.back();
  const back = i > 0 && step !== "done" ? () => setI(i - 1) : undefined;
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
      await publishReport({
        status: kind,
        species,
        name: isLost ? petName.trim() : null,
        breed: breed.trim() || null,
        features: [!isLost && condition ? `Condition: ${CONDITIONS.find((x) => x.value === condition)!.label}.` : "", features.trim()].filter(Boolean).join(" ") || null,
        contact: c.value,
        location: place,
        photoUri,
        profile: { name: userName, city, alertRadiusMi, home },
      });
      setI(steps.indexOf("done"));
    } catch (e) {
      Alert.alert("We couldn't publish your report", e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (step === "photo") {
    return (
      <StepShell title={isLost ? "Add a photo of your pet" : "Snap a quick photo"} step={1} total={total} onClose={close}
        subtitle={isLost ? "Helps others recognize them fast. You can skip this." : "Optional, but it helps the owner confirm it's their pet."}
        cta={{ label: photoUri ? "Continue" : "Skip for now", onPress: next, tone: photoUri ? tone : "neutral" }}>
        <PhotoPicker uri={photoUri} onChange={setPhotoUri} />
      </StepShell>
    );
  }

  if (isLost && step === "details") {
    return (
      <StepShell title="Tell us about your pet" step={2} total={total} onBack={back} onClose={close}
        cta={{ label: "Continue", onPress: next, disabled: !petName.trim() || !species, tone }}>
        <TextField label="Pet's name" placeholder="Max" value={petName} onChangeText={setPetName} />
        <Chips label="Type" options={SPECIES} value={species} onChange={setSpecies} />
        <TextField label="Breed (optional)" placeholder="Golden Retriever" value={breed} onChangeText={setBreed} />
        <TextField label="Distinctive features (optional)" placeholder="Blue collar, limps on left leg" value={features} onChangeText={setFeatures} multiline />
      </StepShell>
    );
  }

  if (step === "where") {
    const n = isLost ? 3 : 2;
    return (
      <StepShell title={isLost ? "Where did you last see them?" : "Confirm the exact spot"} step={n} total={total} onBack={back} onClose={close}
        subtitle={isLost ? "Use your location or enter the spot manually." : "Use your current location or enter the spot manually."}
        cta={{
          label: isLost ? "Review alert" : "Continue",
          onPress: () => { if (isLost && !checkContact().ok) return; next(); },
          disabled: !place || (isLost && !contact.trim()), tone,
        }}>
        <LocationPicker value={place} onChange={setPlace} city={city} center={center} />
        {isLost ? (
          <TextField label="Phone or email" placeholder="(914) 555-0100" value={contact} onChangeText={(t) => { setContact(t); setContactError(null); }}
            onBlur={() => contact.trim() && checkContact()} keyboardType="email-address" autoCapitalize="none" autoComplete="off"
            helper={contactError ?? "Required so people who find your pet can reach you. It appears on your flyer."} />
        ) : null}
      </StepShell>
    );
  }

  if (!isLost && step === "details") {
    return (
      <StepShell title="How do they seem?" step={3} total={total} onBack={back} onClose={close}
        cta={{ label: publishing ? "Posting…" : "Post sighting", onPress: publish, disabled: !species || !condition || !place || publishing, tone }}>
        <Chips label="Type" options={SPECIES} value={species} onChange={setSpecies} />
        <Chips label="Condition" options={CONDITIONS} value={condition} onChange={setCondition} />
        <TextField label="Breed or description (optional)" placeholder="Beagle mix, no collar" value={features} onChangeText={setFeatures} multiline />
        <View style={{ gap: 6 }}>
          <Text style={styles.h2}>Want updates on this pet? (optional)</Text>
          <TextField label="Phone or email" placeholder="(914) 555-0100" value={contact} onChangeText={(t) => { setContact(t); setContactError(null); }}
            keyboardType="email-address" autoCapitalize="none" autoComplete="off"
            helper={contactError ?? "No account needed — this just lets us notify you if there's a match."} />
        </View>
      </StepShell>
    );
  }

  if (isLost && step === "review") {
    return (
      <StepShell title="Review alert" onBack={back} onClose={close}
        subtitle="This publishes immediately and notifies nearby users. You can edit or delete it later."
        cta={{ label: publishing ? "Publishing…" : "Publish alert", onPress: publish, disabled: publishing, tone: "lost" }}>
        <View style={styles.card}>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.thumb} /> : null}
          <Row k="Name" v={petName} />
          <Row k="Type" v={species ?? ""} />
          {breed ? <Row k="Breed" v={breed} /> : null}
          {features ? <Row k="Features" v={features} /> : null}
          <Row k="Last seen" v={place?.label ?? ""} />
          <Row k="Contact" v={contact} />
        </View>
      </StepShell>
    );
  }

  // done
  return (
    <StepShell
      title={isLost ? "Your alert is live" : "Thanks for helping"}
      subtitle={isLost ? "Nearby users have been notified. We'll alert you the moment there's a match." : "Your sighting has been posted to the map."}
      onClose={close}
      cta={{ label: "View on List", onPress: () => router.dismissTo("/(tabs)"), tone: "neutral" }}
      secondary={{ label: "Pet care can get expensive. Free local resources", onPress: () => { router.dismissTo("/(tabs)/support"); } }}>
      <View style={styles.okCircle}><Check size={40} color={C.ok} /></View>
    </StepShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.row}><Text style={styles.k}>{k}</Text><Text style={styles.v}>{v}</Text></View>
  );
}

const styles = StyleSheet.create({
  err: { fontFamily: font.body, fontSize: 13, color: C.sosDark },
  h2: { fontFamily: font.head, fontSize: 17, color: C.ink },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, padding: 16, gap: 12 },
  thumb: { width: "100%", aspectRatio: 4 / 3, borderRadius: radius.md, backgroundColor: C.surface },
  row: { gap: 2 },
  k: { fontFamily: font.bodySemi, fontSize: 12, color: C.slate500, textTransform: "uppercase", letterSpacing: 0.4 },
  v: { fontFamily: font.body, fontSize: 15, color: C.ink },
  okCircle: { alignSelf: "center", width: 88, height: 88, borderRadius: 44, backgroundColor: C.okTint, alignItems: "center", justifyContent: "center", marginTop: 8 },
});
