import * as Location from "expo-location";
import { LocateFixed, MapPin, Navigation } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LatLng } from "../../lib/geo";
import { geocode, Place, reverseGeocode } from "../../lib/geocode";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { toneAccent, type OptionTone } from "../flow/OptionButtons";

// GPS con fallback manual. Label específico del flujo de Report (distinto del "City or ZIP code" del onboarding).
// variant "flow": estilo del prototipo para Report lost / Report a sighting (fila de dirección con ícono, texto auxiliar y enlaces de acción).
// tone: acento del flujo (ícono de la ubicación elegida, spinner, foco del campo manual, enlaces) — ver TextField.
export function LocationPicker({ value, onChange, city, center, variant = "default", tone = "brand" }: { value: Place | null; onChange: (p: Place | null) => void; city?: string; center: LatLng; variant?: "default" | "flow"; tone?: OptionTone }) {
  const [manual, setManual] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const useGps = async () => {
    setBusy(true); setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) throw new Error("Location permission was denied.");
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = pos.coords;
      onChange({ lat, lng, label: (await reverseGeocode(lat, lng)) ?? "Current location", source: "gps" });
      setManual(false);
    } catch (e) {
      setManual(true);
      setError(`${e instanceof Error ? e.message : "Couldn't read your location."} Enter the spot manually instead.`);
    } finally { setBusy(false); }
  };

  const search = async () => {
    if (!query.trim()) return;
    setBusy(true); setError(null); setResults(null);
    try {
      const r = await geocode(query.trim(), city, center);
      setResults(r);
      if (r.length === 0) setError("We couldn't find that spot. Try adding a street name or nearby landmark.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed. Check your connection.");
    } finally { setBusy(false); }
  };

  if (variant === "flow") {
    return (
      <View>
        {value ? (
          <View accessibilityLabel={`Selected location: ${value.label}`}>
            <View style={fl.addrRow}><Navigation size={16} color={toneAccent(tone)} /><Text style={fl.addr}>{value.label}</Text></View>
            <Text style={fl.caption}>{value.source === "manual" ? "Entered manually" : "Auto-detected from your current location"}</Text>
            <Pressable accessibilityRole="button" onPress={() => { onChange(null); setResults(null); setManual(value.source !== "manual"); }} style={fl.link}>
              <Text style={[fl.linkT, { color: toneAccent(tone) }]}>{value.source === "manual" ? "Use my current location instead" : "Can't find the right spot? Enter it manually"}</Text>
            </Pressable>
          </View>
        ) : !manual ? (
          <View>
            <Button label={busy ? "Locating…" : "Use my current location"} variant="secondary" onPress={useGps} disabled={busy} />
            <Pressable accessibilityRole="button" onPress={() => setManual(true)} style={fl.link}><Text style={[fl.linkT, { color: toneAccent(tone) }]}>Can't find the right spot? Enter it manually</Text></Pressable>
            {busy ? <ActivityIndicator color={toneAccent(tone)} /> : null}
            {error ? <Text style={styles.err} accessibilityRole="alert">{error}</Text> : null}
          </View>
        ) : (
          <View>
            <TextField variant="ds" label="Street address or nearest cross streets" helper="Use this if your location was detected incorrectly." placeholder="e.g. Elm St & Maple Ave"
              tone={tone} value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
            <View style={{ height: 12 }} />
            <Button label={busy ? "Searching…" : "Find this spot"} variant="secondary" onPress={search} disabled={busy || !query.trim()} />
            <View style={{ gap: 8, marginTop: results?.length ? 12 : 0 }}>
              {results?.map((p, i) => (
                <Pressable key={i} accessibilityRole="button" onPress={() => onChange({ ...p, source: "manual" })} style={styles.result}>
                  <LocateFixed size={18} color={Theme.text.secondary} /><Text style={styles.resultT}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            {busy ? <ActivityIndicator color={toneAccent(tone)} /> : null}
            {error ? <Text style={styles.err} accessibilityRole="alert">{error}</Text> : null}
            <Pressable accessibilityRole="button" onPress={() => setManual(false)} style={fl.link}><Text style={[fl.linkT, { color: toneAccent(tone) }]}>Use my current location instead</Text></Pressable>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      {value ? (
        <View style={styles.picked} accessibilityLabel={`Selected location: ${value.label}`}>
          <MapPin size={20} color={Theme.status.reunited.bg} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pickedT}>{value.label}</Text>
            <Text style={styles.pickedS}>Saved with this report</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => { onChange(null); setResults(null); }} style={styles.change}><Text style={styles.changeT}>Change</Text></Pressable>
        </View>
      ) : (
        <>
          <Button label={busy && !manual ? "Locating…" : "Use my current location"} variant="secondary" onPress={useGps} disabled={busy} />
          {!manual ? (
            <Pressable accessibilityRole="button" onPress={() => setManual(true)} style={styles.link}>
              <Text style={styles.linkT}>Can't find the right spot? Enter it manually</Text>
            </Pressable>
          ) : (
            <View style={{ gap: 12 }}>
              <TextField label="Street address or nearest cross streets" placeholder="Corner of Elm St & Maple Ave" value={query}
                onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
              <Button label={busy ? "Searching…" : "Find this spot"} variant="secondary" onPress={search} disabled={busy || !query.trim()} />
              {results?.map((p, i) => (
                <Pressable key={i} accessibilityRole="button" onPress={() => onChange(p)} style={styles.result}>
                  <LocateFixed size={18} color={Theme.text.secondary} /><Text style={styles.resultT}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {busy ? <ActivityIndicator color={Theme.brand.primary} /> : null}
          {error ? <Text style={styles.err} accessibilityRole="alert">{error}</Text> : null}
        </>
      )}
    </View>
  );
}

const fl = StyleSheet.create({
  addrRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  addr: { flex: 1, ...typography.label14, color: Theme.text.primary },
  caption: { ...typography.caption12, color: Theme.text.muted, marginTop: 4 },
  link: { alignSelf: "flex-start", marginTop: 16, paddingVertical: 8, minHeight: MIN_HIT, justifyContent: "center" },
  linkT: typography.label14, // color: el acento del tono del flujo (contraste ≥ 4.5:1 sobre blanco en los tres)
});

const styles = StyleSheet.create({
  picked: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: Theme.status.reunited.tint },
  pickedT: { ...typography.label14, color: Theme.text.primary },
  pickedS: { ...typography.caption12, color: Theme.text.secondary },
  change: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 4 },
  changeT: { ...typography.label14, color: Theme.text.primary },
  link: { minHeight: MIN_HIT, justifyContent: "center" },
  linkT: { ...typography.label14, color: Theme.text.secondary, textDecorationLine: "underline" },
  result: { minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: Theme.border.default },
  resultT: { flex: 1, ...typography.label14, color: Theme.text.primary },
  err: { ...typography.bodySm13, color: Theme.danger.text },
});
