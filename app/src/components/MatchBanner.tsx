import { Sparkles, X } from "lucide-react-native";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { MyMatch } from "../lib/database.types";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// "Possible match" (especie y zona coinciden) o "Strong match" (además coincide la raza) — §6.
export function MatchBanner({ match, onView, onDismiss }: { match: MyMatch; onView: () => void; onDismiss: () => void }) {
  const strong = match.confidence === "strong";
  const title = `${strong ? "Strong" : "Possible"} match for ${match.lost_name ?? "your pet"}`;
  return (
    <View style={styles.box} accessibilityRole="alert">
      {match.sighted_photo_url ? <Image source={{ uri: match.sighted_photo_url }} style={styles.photo} /> : (
        <View style={[styles.photo, styles.icon]}><Sparkles size={22} color={C.warn} /></View>
      )}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub} numberOfLines={2}>
          A sighting{match.sighted_breed ? ` of a ${match.sighted_breed}` : ""}{match.sighted_label ? ` near ${match.sighted_label}` : ""} looks like your pet.
        </Text>
        <Pressable accessibilityRole="button" onPress={onView} style={styles.view}><Text style={styles.viewT}>View on map</Text></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss match" onPress={onDismiss} style={styles.x}><X size={18} color={C.slate500} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: "row", gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: C.warnTint, borderWidth: 1, borderColor: C.warn },
  photo: { width: 56, height: 56, borderRadius: radius.md, backgroundColor: C.white },
  icon: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: font.head, fontSize: 16, color: C.ink },
  sub: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  view: { minHeight: 36, justifyContent: "center", alignSelf: "flex-start" },
  viewT: { fontFamily: font.bodyBold, fontSize: 13, color: C.warn },
  x: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: -8, marginRight: -8 },
});
