import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMyReports } from "../hooks/useMyReports";
import { usePets } from "../hooks/usePets";
import { deleteAccount } from "../lib/account";
import { useSession } from "../state/session";
import { C, MIN_HIT, font, radius } from "../theme/tokens";

// Delete account: explica qué se elimina y qué pasa con los reportes activos, y exige escribir DELETE. La eliminación es real
// (fotos del bucket, reportes, mascotas, perfil y usuario de auth). Es un requisito de Apple para apps que permiten crear cuenta.
export default function DeleteAccount() {
  const insets = useSafeAreaInsets();
  const { reset } = useSession();
  const { reports } = useMyReports();
  const { pets } = usePets();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const activeLost = useMemo(() => reports.filter((r) => r.status === "lost").map((r) => r.name?.trim() || "your pet"), [reports]);
  const ready = typed.trim().toUpperCase() === "DELETE";

  const run = async () => {
    setBusy(true);
    try {
      await deleteAccount();
      reset();
      router.replace("/(onboarding)");
    } catch (e) {
      Alert.alert("We couldn't delete your account", `${e instanceof Error ? e.message : "Something went wrong."}\n\nNothing else was changed. Please try again.`);
    } finally { setBusy(false); }
  };
  const confirm = () => Alert.alert("Delete your account?", "This can't be undone.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete account", style: "destructive", onPress: run },
  ]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={C.ink} /></Pressable>
        <Text style={styles.h} accessibilityRole="header">Delete account</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.lead}>This permanently deletes your PetBeacon account and everything in it. It can't be undone.</Text>
        <View style={styles.box}>
          <Text style={styles.boxT}>What will be deleted</Text>
          <Text style={styles.li}>• Your profile and contact details</Text>
          <Text style={styles.li}>• {pets.length > 0 ? `Your ${pets.length} registered ${pets.length === 1 ? "pet" : "pets"}` : "Your registered pets"}</Text>
          <Text style={styles.li}>• All the reports and sightings you published, and their matches</Text>
          <Text style={styles.li}>• Your photos</Text>
        </View>
        {activeLost.length > 0 ? (
          <View style={[styles.box, { borderColor: C.ink, borderWidth: 2 }]}>
            <Text style={styles.boxT}>Your active alerts</Text>
            <Text style={styles.li}>{`The alert for ${activeLost.length === 1 ? activeLost[0] : "your pets"} will be closed and will stop sending alerts. Neighbors won't be able to reach you about ${activeLost.length === 1 ? "it" : "them"} anymore.`}</Text>
          </View>
        ) : null}
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Type DELETE to confirm</Text>
          <TextInput value={typed} onChangeText={setTyped} placeholder="DELETE" placeholderTextColor={C.slate500} autoCapitalize="characters" autoCorrect={false} accessibilityLabel="Type DELETE to confirm" style={styles.input} />
        </View>
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !ready || busy }} disabled={!ready || busy} onPress={confirm}
          style={[styles.danger, (!ready || busy) && { backgroundColor: C.border }]}>
          <Text style={[styles.dangerT, (!ready || busy) && { color: C.slate500 }]}>{busy ? "Deleting…" : "Delete account"}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  h: { fontFamily: font.displayMedium, fontSize: 22, color: C.ink },
  lead: { fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22, color: C.slate700 },
  box: { gap: 6, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  boxT: { fontFamily: font.head, fontSize: 15, color: C.ink },
  li: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 20, color: C.slate700 },
  label: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700 },
  input: { minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, paddingHorizontal: 14, fontFamily: font.bodyBold, fontSize: 16, letterSpacing: 2, color: C.ink },
  danger: { height: 56, borderRadius: radius.md, backgroundColor: C.sosDark, alignItems: "center", justifyContent: "center" },
  dangerT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
});
