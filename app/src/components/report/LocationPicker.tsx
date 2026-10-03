import * as Location from "expo-location";
import { LocateFixed, MapPin, Navigation } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "../AppText";
import { LatLng } from "../../lib/geo";
import { geocode, Place, reverseGeocode } from "../../lib/geocode";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";
import { Button } from "../Button";
import { TextField } from "../TextField";

// GPS con fallback manual. Label específico del flujo de Report (distinto del "City or ZIP code" del onboarding).
// variant "flow": estilo del prototipo para Report lost / Report a sighting (fila de dirección con ícono, texto auxiliar y enlaces rojos).
export function LocationPicker({ value, onChange, city, center, variant = "default" }: { value: Place | null; onChange: (p: Place | null) => void; city?: string; center: LatLng; variant?: "default" | "flow" }) {
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
            <View style={fl.addrRow}><Navigation size={16} color={Theme.brand.primary} /><AppText style={fl.addr}>{value.label}</AppText></View>
            <AppText style={fl.caption}>{value.source === "manual" ? "Entered manually" : "Auto-detected from your current location"}</AppText>
            <Pressable accessibilityRole="button" onPress={() => { onChange(null); setResults(null); setManual(value.source !== "manual"); }} style={fl.link}>
              <AppText style={fl.linkT}>{value.source === "manual" ? "Use my current location instead" : "Can't find the right spot? Enter it manually"}</AppText>
            </Pressable>
          </View>
        ) : !manual ? (
          <View>
            <Button label={busy ? "Locating…" : "Use my current location"} variant="secondary" onPress={useGps} disabled={busy} />
            <Pressable accessibilityRole="button" onPress={() => setManual(true)} style={fl.link}><AppText style={fl.linkT}>Can't find the right spot? Enter it manually</AppText></Pressable>
            {busy ? <ActivityIndicator color={Theme.brand.primary} /> : null}
            {error ? <AppText style={styles.err} accessibilityRole="alert">{error}</AppText> : null}
          </View>
        ) : (
          <View>
            <TextField variant="ds" label="Street address or nearest cross streets" helper="Use this if your location was detected incorrectly." placeholder="e.g. Elm St & Maple Ave"
              value={query} onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
            <View style={{ height: 12 }} />
            <Button label={busy ? "Searching…" : "Find this spot"} variant="secondary" onPress={search} disabled={busy || !query.trim()} />
            <View style={{ gap: 8, marginTop: results?.length ? 12 : 0 }}>
              {results?.map((p, i) => (
                <Pressable key={i} accessibilityRole="button" onPress={() => onChange({ ...p, source: "manual" })} style={styles.result}>
                  <LocateFixed size={18} color={Theme.text.secondary} /><AppText style={styles.resultT}>{p.label}</AppText>
                </Pressable>
              ))}
            </View>
            {busy ? <ActivityIndicator color={Theme.brand.primary} /> : null}
            {error ? <AppText style={styles.err} accessibilityRole="alert">{error}</AppText> : null}
            <Pressable accessibilityRole="button" onPress={() => setManual(false)} style={fl.link}><AppText style={fl.linkT}>Use my current location instead</AppText></Pressable>
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
            <AppText style={styles.pickedT}>{value.label}</AppText>
            <AppText style={styles.pickedS}>Saved with this report</AppText>
          </View>
          <Pressable accessibilityRole="button" onPress={() => { onChange(null); setResults(null); }} style={styles.change}><AppText style={styles.changeT}>Change</AppText></Pressable>
        </View>
      ) : (
        <>
          <Button label={busy && !manual ? "Locating…" : "Use my current location"} variant="secondary" onPress={useGps} disabled={busy} />
          {!manual ? (
            <Pressable accessibilityRole="button" onPress={() => setManual(true)} style={styles.link}>
              <AppText style={styles.linkT}>Can't find the right spot? Enter it manually</AppText>
            </Pressable>
          ) : (
            <View style={{ gap: 12 }}>
              <TextField label="Street address or nearest cross streets" placeholder="Corner of Elm St & Maple Ave" value={query}
                onChangeText={setQuery} onSubmitEditing={search} returnKeyType="search" />
              <Button label={busy ? "Searching…" : "Find this spot"} variant="secondary" onPress={search} disabled={busy || !query.trim()} />
              {results?.map((p, i) => (
                <Pressable key={i} accessibilityRole="button" onPress={() => onChange(p)} style={styles.result}>
                  <LocateFixed size={18} color={Theme.text.secondary} /><AppText style={styles.resultT}>{p.label}</AppText>
                </Pressable>
              ))}
            </View>
          )}
          {busy ? <ActivityIndicator color={Theme.brand.primary} /> : null}
          {error ? <AppText style={styles.err} accessibilityRole="alert">{error}</AppText> : null}
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
  linkT: { ...typography.label14, color: Theme.status.lost.bgStrong },
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
