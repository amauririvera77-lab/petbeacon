import * as Location from "expo-location";
import { LocateFixed, MapPin } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LatLng } from "../../lib/geo";
import { geocode, Place, reverseGeocode } from "../../lib/geocode";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";
import { Button } from "../Button";
import { TextField } from "../TextField";

// GPS con fallback manual. Label específico del flujo de Report (distinto del "City or ZIP code" del onboarding).
export function LocationPicker({ value, onChange, city, center }: { value: Place | null; onChange: (p: Place | null) => void; city?: string; center: LatLng }) {
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
      onChange({ lat, lng, label: (await reverseGeocode(lat, lng)) ?? "Current location" });
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

  return (
    <View style={{ gap: 14 }}>
      {value ? (
        <View style={styles.picked} accessibilityLabel={`Selected location: ${value.label}`}>
          <MapPin size={20} color={C.ok} />
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
                  <LocateFixed size={18} color={C.slate700} /><Text style={styles.resultT}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          {busy ? <ActivityIndicator color={C.teal} /> : null}
          {error ? <Text style={styles.err} accessibilityRole="alert">{error}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  picked: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: C.okTint },
  pickedT: { fontFamily: font.bodySemi, fontSize: 14, color: C.ink },
  pickedS: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate700 },
  change: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 4 },
  changeT: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  link: { minHeight: MIN_HIT, justifyContent: "center" },
  linkT: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700, textDecorationLine: "underline" },
  result: { minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: radius.md, borderWidth: 1, borderColor: C.border },
  resultT: { flex: 1, fontFamily: font.body, fontSize: 14, color: C.ink },
  err: { fontFamily: font.body, fontSize: 13, color: C.sosDark },
});
