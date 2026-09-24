import { router, useFocusEffect } from "expo-router";
import { ChevronRight, PawPrint, Plus, User } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EditLocationSheet } from "../../components/EditLocationSheet";
import { FocusImage } from "../../components/FocusImage";
import { OfflineBanner } from "../../components/OfflineBanner";
import { RadiusSlider } from "../../components/RadiusSlider";
import { ToggleRow } from "../../components/ToggleRow";
import { saveProfilePref, useEnablePush } from "../../hooks/useEnablePush";
import { usePets } from "../../hooks/usePets";
import { logout } from "../../lib/account";
import { useSession } from "../../state/session";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

// Profile (prototipo): cabecera con avatar, nombre y ciudad editable; radio de alerta; notificaciones;
// mascotas registradas; Help and FAQ; Log out siempre al final.
export default function Profile() {
  const insets = useSafeAreaInsets();
  const { name, city, alertRadiusMi, emailEnabled, update, reset } = useSession();
  const { perm, on: pushOn, enable, disable } = useEnablePush();
  const { pets, refresh: refreshPets } = usePets();
  const [cityOpen, setCityOpen] = useState(false);

  useFocusEffect(useCallback(() => { refreshPets(); }, [refreshPets]));

  // La cuenta es anónima (sin contraseña): cerrar sesión no se puede deshacer. Se avisa antes.
  // Se navega a "/(onboarding)" explícito: "/" es ambigua (index, (tabs)/index y (onboarding)/index resuelven todos a esa ruta).
  const confirmLogout = () =>
    Alert.alert(
      "Log out?",
      "PetBeacon doesn't use passwords yet, so once you log out you won't be able to get back to your reports and registered pets on this account.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log out", style: "destructive", onPress: async () => { try { await logout(); } finally { reset(); router.replace("/(onboarding)"); } } },
      ],
    );

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <OfflineBanner />
        <View style={styles.head}>
          <View style={styles.avatar}><User size={30} color={C.teal} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name || "Your profile"}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit location" onPress={() => setCityOpen(true)} style={styles.cityBtn}>
              <Text style={styles.city} numberOfLines={1}>{city || "Add your city"}</Text>
              <ChevronRight size={14} color="#94A3B8" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 200 }}>
        <Text style={styles.sec}>Alert radius</Text>
        <View style={[styles.card, { padding: 16, marginBottom: 32 }]}>
          <View style={styles.radiusHead}>
            <Text style={styles.radiusLabel}>Notify me about activity within</Text>
            <Text style={styles.radiusValue}>{alertRadiusMi} mi</Text>
          </View>
          <RadiusSlider value={alertRadiusMi} onChange={(v) => update({ alertRadiusMi: v })} showValue={false} />
        </View>

        <Text style={styles.sec}>Notifications</Text>
        <View style={[styles.card, { marginBottom: 32 }]}>
          <View style={styles.row}>
            <ToggleRow title="Push alerts" subtitle="Proximity alerts and match updates" value={pushOn} onChange={(v) => (v ? enable() : disable())}
              note={perm === "denied" ? "Notifications are off for Expo Go in iPhone Settings." : undefined} />
          </View>
          <View style={[styles.row, styles.divider]}>
            <ToggleRow title="Email summaries" subtitle="Weekly digest of nearby activity" value={emailEnabled}
              onChange={(v) => { update({ emailEnabled: v }); saveProfilePref({ email_notifications_enabled: v }); }} />
          </View>
        </View>

        <Text style={styles.sec}>Registered pets</Text>
        <View style={{ gap: 8, marginBottom: 32 }}>
          {pets.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/pet", params: { id: p.id } })}
              style={({ pressed }) => [styles.petRow, pressed && { backgroundColor: C.surface }]}>
              <View style={styles.thumb}>
                {p.photo_url ? <FocusImage uri={p.photo_url} style={StyleSheet.absoluteFill} /> : <PawPrint size={22} color="#94A3B8" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{p.name}</Text>
                {p.breed ? <Text style={styles.petBreed}>{p.breed}</Text> : null}
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </Pressable>
          ))}
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/pet", params: { id: "new" } })}
            style={({ pressed }) => [styles.petRow, styles.addRow, pressed && { backgroundColor: C.surface }]}>
            <View style={[styles.thumb, { backgroundColor: "transparent" }]}><Plus size={22} color={C.slate700} /></View>
            <Text style={styles.addT}>{pets.length === 0 ? "Register your pet" : "Add another pet"}</Text>
          </Pressable>
        </View>

        <Pressable accessibilityRole="button" onPress={() => router.push("/help")} style={({ pressed }) => [styles.helpRow, pressed && { opacity: 0.75 }]}>
          <Text style={styles.sec2}>Help and FAQ</Text>
          <ChevronRight size={18} color="#94A3B8" />
        </Pressable>

        <Pressable accessibilityRole="button" onPress={confirmLogout} style={({ pressed }) => [styles.logout, pressed && { backgroundColor: "#F1F5F9" }]}>
          <Text style={styles.logoutT}>Log out</Text>
        </Pressable>
      </ScrollView>

      <EditLocationSheet visible={cityOpen} onClose={() => setCityOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  head: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, paddingVertical: 24, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: font.head, fontSize: 20, color: C.ink },
  cityBtn: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 28, alignSelf: "flex-start" },
  city: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700, flexShrink: 1 },
  sec: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 0.72, textTransform: "uppercase", color: C.slate500, marginBottom: 12 },
  sec2: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 0.72, textTransform: "uppercase", color: C.slate500 },
  card: { borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  radiusHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  radiusLabel: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700, flex: 1 },
  radiusValue: { fontFamily: font.bodyBold, fontSize: 16, color: C.teal },
  row: { padding: 16 },
  divider: { borderTopWidth: 1, borderTopColor: C.border },
  petRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  addRow: { borderStyle: "dashed", borderColor: C.border2 },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  petName: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  petBreed: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
  addT: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: C.slate700 },
  helpRow: { minHeight: MIN_HIT + 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, marginBottom: 8 },
  logout: { height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  logoutT: { fontFamily: font.bodyBold, fontSize: 15, color: C.slate700 },
});
