import { router, useFocusEffect } from "expo-router";
import { ChevronRight, PawPrint, Plus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../components/account/Avatar";
import { SaveAccountSheet } from "../../components/account/SaveAccountSheet";
import { Badge } from "../../components/Badge";
import { EditLocationSheet } from "../../components/EditLocationSheet";
import { FocusImage } from "../../components/FocusImage";
import { OfflineBanner } from "../../components/OfflineBanner";
import { RadiusChips } from "../../components/RadiusChips";
import { ScreenTitle } from "../../components/ScreenTitle";
import { useSnackbar } from "../../components/Snackbar";
import { ToggleRow } from "../../components/ToggleRow";
import { useAccount } from "../../hooks/useAccount";
import { saveProfilePref, useEnablePush } from "../../hooks/useEnablePush";
import { useFabScroll } from "../../hooks/useFabScroll";
import { useMyReports } from "../../hooks/useMyReports";
import { usePets } from "../../hooks/usePets";
import { logout } from "../../lib/account";
import { petState } from "../../lib/petStatus";
import { useOnboardingPreview } from "../../state/onboardingPreview";
import { useSession } from "../../state/session";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

// ⚠️ HERRAMIENTA DE DISEÑO — quitar junto con la sección "Design tools" (más abajo) antes de publicar.
// Solo visible con EXPO_PUBLIC_SHOW_DESIGN_TOOLS=true (no __DEV__), para poder revisarla también en builds de EAS Update.
const SHOW_DESIGN_TOOLS = process.env.EXPO_PUBLIC_SHOW_DESIGN_TOOLS === "true";

// Profile: identidad (foto o iniciales, nombre y zona de alertas), invitación a guardar la cuenta, radio de alertas, notificaciones por categoría,
// mascotas registradas, cuenta (editar perfil, privacidad), ayuda y cierre de sesión.
export default function Profile() {
  const insets = useSafeAreaInsets();
  const { name, city, alertRadiusMi, emailEnabled, avatarUrl, update, reset } = useSession();
  const preview = useOnboardingPreview();
  const { perm, nearbyOn, matchOn, enable, disableKind } = useEnablePush();
  const { pets, refresh: refreshPets } = usePets();
  const { reports: myReports, refresh: refreshMine } = useMyReports();
  const account = useAccount();
  const { onScroll } = useFabScroll();
  const snackbar = useSnackbar();
  const [cityOpen, setCityOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  useFocusEffect(useCallback(() => { refreshPets(); refreshMine(); }, [refreshPets, refreshMine]));

  // Nombres de las mascotas con un Lost activo: para advertir al apagar "Match updates" y al cerrar sesión.
  const lostNames = useMemo(() => myReports.filter((r) => r.status === "lost").map((r) => r.name?.trim() || "your pet"), [myReports]);
  const lostLabel = lostNames.length === 0 ? "" : lostNames.length === 1 ? lostNames[0] : lostNames.length === 2 ? `${lostNames[0]} and ${lostNames[1]}` : "your pets";
  const hasLost = lostNames.length > 0;

  const toggleMatch = (v: boolean) => {
    if (v) { enable("match"); return; }
    if (!hasLost) { disableKind("match"); return; }
    Alert.alert("Turn off match updates?", `You won't be notified if someone sees ${lostLabel}. Turn off anyway?`, [
      { text: "Turn off", style: "destructive", onPress: () => disableKind("match") },
      { text: "Keep on", style: "cancel" },
    ]);
  };

  const doLogout = async () => { try { await logout(); } finally { reset(); router.replace("/(onboarding)"); } };
  // Cerrar sesión: una cuenta anónima se pierde para siempre (se ofrece guardarla antes); una guardada se puede recuperar con el correo.
  const confirmLogout = () => {
    const lostNote = hasLost ? `\n\nYou won't receive match updates for ${lostLabel} while logged out.` : "";
    if (account.isAnonymous) {
      Alert.alert("Log out?", `Your account isn't saved yet. If you log out you'll lose access to your reports and pets forever.${lostNote}`, [
        { text: "Save your account first", onPress: () => setSaveOpen(true) },
        { text: "Log out anyway", style: "destructive", onPress: doLogout },
        { text: "Cancel", style: "cancel" },
      ]);
    } else {
      Alert.alert("Log out?", `You can log back in any time with ${account.email ?? "your email"}.${lostNote}`, [
        { text: "Cancel", style: "cancel" },
        { text: "Log out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <OfflineBanner />
      </View>

      {/* Cabecera (foto, nombre, zona de alertas) DENTRO del scroll (evaluación UX): se desplaza con el contenido, no queda fija. */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 200 }} onScroll={onScroll} scrollEventThrottle={16}>
        <View style={styles.titleWrap}><ScreenTitle title="Profile" /></View>
        <View style={styles.head}>
          <Avatar uri={avatarUrl} name={name} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{name || "Your profile"}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit alert area" onPress={() => setCityOpen(true)} style={styles.cityBtn}>
              <Text style={styles.city} numberOfLines={1}>Alert area: {city || "add your city"}</Text>
              <ChevronRight size={14} color="#94A3B8" />
            </Pressable>
          </View>
        </View>
        {/* Con un Lost activo y la cuenta sin guardar, la invitación es prominente: perder la cuenta sería perder el reporte. */}
        {account.ready && account.isAnonymous && hasLost ? (
          <View style={styles.saveCard}>
            <Text style={styles.saveT}>Save your account</Text>
            <Text style={styles.saveS}>{`You have an active alert for ${lostLabel}. Add your email so you never lose access to it, even if you switch phones.`}</Text>
            <Pressable accessibilityRole="button" onPress={() => setSaveOpen(true)} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.saveBtnT}>Add email</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sec}>Alert radius</Text>
        <View style={[styles.card, { padding: 16, marginBottom: 32, gap: 12 }]}>
          <Text style={styles.radiusHelp}>We'll send you notifications about lost and sighted pets within this distance of your alert area.</Text>
          <RadiusChips value={alertRadiusMi} onChange={(v) => update({ alertRadiusMi: v })} />
        </View>

        <Text style={styles.sec}>Notifications</Text>
        <View style={[styles.card, { marginBottom: 32 }]}>
          <View style={styles.row}>
            <ToggleRow title="Nearby alerts" subtitle="Lost and sighted pets near you" value={nearbyOn} onChange={(v) => (v ? enable("nearby") : disableKind("nearby"))}
              note={perm === "denied" ? "Notifications are off for Expo Go in iPhone Settings." : undefined} />
          </View>
          <View style={[styles.row, styles.divider]}>
            <ToggleRow title="Match updates" subtitle="When someone may have seen your pet" value={matchOn} onChange={toggleMatch} />
          </View>
          <View style={[styles.row, styles.divider]}>
            <ToggleRow title="Email summaries" subtitle="Weekly digest of nearby activity" value={emailEnabled}
              onChange={(v) => { update({ emailEnabled: v }); saveProfilePref({ email_notifications_enabled: v }); }} />
          </View>
        </View>

        <Text style={styles.sec}>Registered pets</Text>
        <View style={{ gap: 8, marginBottom: 32 }}>
          {pets.map((p) => {
            const st = petState(p.id, myReports); // Home / Lost / Reunited, derivado de sus reportes
            return (
              <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/pet", params: { id: p.id } })}
                style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: C.surface }]}>
                <View style={styles.thumb}>
                  {p.photo_url ? <FocusImage uri={p.photo_url} style={StyleSheet.absoluteFill} /> : <PawPrint size={22} color="#94A3B8" />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.petName} numberOfLines={1}>{p.name}</Text>
                    {st.state !== "home" ? <Badge status={st.state} /> : null}
                  </View>
                  {p.breed ? <Text style={styles.petBreed}>{p.breed}</Text> : null}
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </Pressable>
            );
          })}
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/pet", params: { id: "new" } })}
            style={({ pressed }) => [styles.listRow, styles.addRow, pressed && { backgroundColor: C.surface }]}>
            <View style={[styles.thumb, { backgroundColor: "transparent" }]}><Plus size={22} color={C.slate700} /></View>
            <Text style={styles.addT}>{pets.length === 0 ? "Register your pet" : "Add another pet"}</Text>
          </Pressable>
        </View>

        <Text style={styles.sec}>Account</Text>
        <View style={{ gap: 8, marginBottom: 24 }}>
          <NavRow title="Edit profile" subtitle="Name, photo and contact details" onPress={() => router.push("/edit-profile")} />
          <NavRow title="Privacy" subtitle="What others can see and what stays private" onPress={() => router.push("/privacy")} />
          {account.ready && account.isAnonymous && !hasLost ? (
            <NavRow title="Save your account" subtitle="Add your email to get back to your reports and pets from any device" onPress={() => setSaveOpen(true)} />
          ) : null}
          {account.ready && !account.isAnonymous ? (
            <View style={[styles.listRow, { opacity: 0.9 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>Account saved</Text>
                <Text style={styles.petBreed} numberOfLines={1}>{account.email}</Text>
              </View>
            </View>
          ) : null}
          <NavRow title="Help and FAQ" onPress={() => router.push("/help")} />
        </View>

        <Pressable accessibilityRole="button" onPress={confirmLogout} style={({ pressed }) => [styles.logout, pressed && { backgroundColor: "#F1F5F9" }]}>
          <Text style={styles.logoutT}>Log out</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/delete-account")} style={styles.deleteLink}>
          <Text style={styles.deleteT}>Delete account</Text>
        </Pressable>

        {/* ⚠️ HERRAMIENTA DE DISEÑO — quitar o desactivar antes de publicar. Controlada por EXPO_PUBLIC_SHOW_DESIGN_TOOLS (no __DEV__),
            para poder revisarla también en builds de EAS Update. "Replay onboarding" nunca toca la cuenta real: ver state/onboardingPreview.tsx. */}
        {SHOW_DESIGN_TOOLS ? (
          <>
            <Text style={[styles.sec, { marginTop: 32 }]}>Design tools</Text>
            <NavRow title="Replay onboarding" subtitle="Preview only — doesn't affect your account or data" onPress={() => { preview.start(); router.push("/(onboarding)"); }} />
          </>
        ) : null}
      </ScrollView>

      <EditLocationSheet visible={cityOpen} onClose={() => setCityOpen(false)} />
      <SaveAccountSheet visible={saveOpen} mode="save" onClose={() => setSaveOpen(false)} onDone={(email) => { setSaveOpen(false); snackbar.show({ message: `Account saved with ${email}` }); }} />
    </View>
  );
}

// Fila de lista tocable: mismo estilo que las filas de mascotas.
function NavRow({ title, subtitle, onPress }: { title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: C.surface }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.petName}>{title}</Text>
        {subtitle ? <Text style={styles.petBreed}>{subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color="#94A3B8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  // El padding horizontal y superior ya los da el contenedor del ScrollView: esta cabecera vive DENTRO de él y se desplaza con el resto.
  titleWrap: { marginBottom: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: 16, paddingBottom: 20, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  name: { fontFamily: font.head, fontSize: 20, color: C.ink },
  cityBtn: { flexDirection: "row", alignItems: "center", gap: 4, minHeight: 28, alignSelf: "flex-start" },
  city: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700, flexShrink: 1 },
  saveCard: { gap: 8, padding: 16, marginBottom: 24, borderRadius: radius.lg, borderWidth: 2, borderColor: C.ink, backgroundColor: C.white },
  saveT: { fontFamily: font.head, fontSize: 17, color: C.ink },
  saveS: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 20, color: C.slate700 },
  saveBtn: { minHeight: 48, borderRadius: radius.md, backgroundColor: C.ink, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveBtnT: { fontFamily: font.bodyBold, fontSize: 15, color: C.white },
  sec: { fontFamily: font.bodyBold, fontSize: 12, letterSpacing: 0.72, textTransform: "uppercase", color: C.slate500, marginBottom: 12 },
  card: { borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border, overflow: "hidden" },
  radiusHelp: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19, color: C.slate700 },
  row: { padding: 16 },
  divider: { borderTopWidth: 1, borderTopColor: C.border },
  listRow: { minHeight: MIN_HIT + 16, flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  addRow: { borderStyle: "dashed", borderColor: C.border2 },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  petName: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  petBreed: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
  addT: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: C.slate700 },
  logout: { height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white, alignItems: "center", justifyContent: "center" },
  deleteLink: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: 8 },
  deleteT: { fontFamily: font.bodySemi, fontSize: 13, color: C.sosDark, textDecorationLine: "underline" },
  logoutT: { fontFamily: font.bodyBold, fontSize: 15, color: C.slate700 },
});
