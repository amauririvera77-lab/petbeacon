import { router, useFocusEffect } from "expo-router";
import { ChevronRight, MapPin, PawPrint, Plus } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../../components/account/Avatar";
import { SaveAccountSheet } from "../../components/account/SaveAccountSheet";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EditLocationSheet } from "../../components/EditLocationSheet";
import { FocusImage } from "../../components/FocusImage";
import { OfflineBanner } from "../../components/OfflineBanner";
import { RadiusChips } from "../../components/RadiusChips";
import { ScreenTitle } from "../../components/ScreenTitle";
import { useSnackbar } from "../../components/Snackbar";
import { ToggleRow } from "../../components/ToggleRow";
import { useAccount } from "../../hooks/useAccount";
import { saveProfilePref, useEnablePush } from "../../hooks/useEnablePush";
import { useMyReports } from "../../hooks/useMyReports";
import { usePets } from "../../hooks/usePets";
import { logout } from "../../lib/account";
import { breedLabel } from "../../lib/breeds";
import { petState } from "../../lib/petStatus";
import { useOnboardingPreview } from "../../state/onboardingPreview";
import { useSession } from "../../state/session";
import { useTabBarClearance } from "../../hooks/useTabBarClearance";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// ⚠️ HERRAMIENTA DE DISEÑO — quitar junto con la sección "Design tools" (más abajo) antes de publicar.
// Solo visible con EXPO_PUBLIC_SHOW_DESIGN_TOOLS=true (no __DEV__), para poder revisarla también en builds de EAS Update.
const SHOW_DESIGN_TOOLS = process.env.EXPO_PUBLIC_SHOW_DESIGN_TOOLS === "true";

// Profile: identidad (foto o iniciales, nombre y zona de alertas), invitación a guardar la cuenta, radio de alertas, notificaciones por categoría,
// mascotas registradas, cuenta (editar perfil, privacidad), ayuda y cierre de sesión.
export default function Profile() {
  const insets = useSafeAreaInsets();
  const TAB_BAR_CLEARANCE = useTabBarClearance();
  const { name, city, alertRadiusMi, emailEnabled, avatarUrl, update, reset } = useSession();
  const preview = useOnboardingPreview();
  const { perm, nearbyOn, matchOn, enable, disableKind } = useEnablePush();
  const { pets, refresh: refreshPets } = usePets();
  const { reports: myReports, refresh: refreshMine } = useMyReports();
  const account = useAccount();
  const snackbar = useSnackbar();
  const [cityOpen, setCityOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  useFocusEffect(useCallback(() => { refreshPets(); refreshMine(); }, [refreshPets, refreshMine]));

  // Nombres de las mascotas con un Lost activo: para advertir al apagar "Match updates" y al cerrar sesión. 3+ muestra
  // el número real ("3 pets"), no un genérico "your pets" (fase de congelación, Fase 11 — plural correcto en "Save your account").
  const lostNames = useMemo(() => myReports.filter((r) => r.status === "lost").map((r) => r.name?.trim() || "your pet"), [myReports]);
  const lostLabel = lostNames.length === 0 ? "" : lostNames.length === 1 ? lostNames[0] : lostNames.length === 2 ? `${lostNames[0]} and ${lostNames[1]}` : `${lostNames.length} pets`;
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
      <View style={{ paddingTop: insets.top, backgroundColor: Theme.surface.card }}>
        <OfflineBanner />
      </View>

      {/* Cabecera (foto, nombre, zona de alertas) DENTRO del scroll (evaluación UX): se desplaza con el contenido, no queda fija. */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: TAB_BAR_CLEARANCE }}>
        <View style={styles.titleWrap}><ScreenTitle title="Profile" variant="display" /></View>
        <View style={styles.head}>
          <Avatar uri={avatarUrl} name={name} size={64} />
          <View style={{ flex: 1 }}>
            <AppText style={styles.name} numberOfLines={1}>{name || "Your profile"}</AppText>
          </View>
        </View>
        {/* "Save your account" es siempre una llamada a la acción aparte, nunca una fila dentro de otra tarjeta (Fase 9 de
            congelación) — antes, sin un Lost activo, vivía como fila discreta dentro de "Account"; ahora es la misma
            tarjeta en los dos casos, solo cambia el texto. */}
        {account.ready && account.isAnonymous ? (
          <View style={styles.saveCard}>
            <AppText style={styles.saveT}>Save your account</AppText>
            <AppText style={styles.saveS}>
              {hasLost
                ? `You have ${lostNames.length === 1 ? "an active alert" : "active alerts"} for ${lostLabel}. Add your email so you never lose access to it, even if you switch phones.`
                : "Add your email to get back to your reports and pets from any device."}
            </AppText>
            <Pressable accessibilityRole="button" onPress={() => setSaveOpen(true)} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}>
              <AppText role="control" style={styles.saveBtnT}>Add email</AppText>
            </Pressable>
          </View>
        ) : null}

        {/* "Alert area" (Fase 9 de congelación): una sola tarjeta con la ubicación (antes una línea suelta en el header)
            y el radio de alerta (antes su propia sección) — son la misma idea, "dónde y qué tan lejos te avisamos". */}
        <AppText style={styles.sec}>Alert area</AppText>
        <View style={[styles.card, { marginBottom: 32 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit alert area" onPress={() => setCityOpen(true)}
            style={({ pressed }) => [styles.row, styles.rowFlex, pressed && { backgroundColor: Theme.surface.page }]}>
            <MapPin size={20} color={Theme.text.secondary} />
            <AppText style={styles.locationT} numberOfLines={1}>{city || "Add your city"}</AppText>
            <ChevronRight size={18} color={Theme.text.muted} />
          </Pressable>
          <View style={[styles.row, styles.divider, { gap: 12 }]}>
            <AppText style={styles.radiusHelp}>We'll send you notifications about lost and sighted pets within this distance of your alert area.</AppText>
            <RadiusChips value={alertRadiusMi} onChange={(v) => update({ alertRadiusMi: v })} />
          </View>
        </View>

        <AppText style={styles.sec}>Notifications</AppText>
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

        <AppText style={styles.sec}>Registered pets</AppText>
        <View style={{ gap: 8, marginBottom: 32 }}>
          {pets.map((p) => {
            const st = petState(p.id, myReports); // Home / Lost / Reunited, derivado de sus reportes
            return (
              <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/pet", params: { id: p.id } })}
                style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: Theme.surface.page }]}>
                <View style={styles.thumb}>
                  {p.photo_url ? <FocusImage uri={p.photo_url} focusX={p.photo_focus_x} focusY={p.photo_focus_y} style={StyleSheet.absoluteFill} /> : <PawPrint size={22} color={Theme.text.muted} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <AppText style={styles.rowTitle} numberOfLines={1}>{p.name}</AppText>
                    {st.state !== "home" ? <Badge status={st.state} /> : null}
                  </View>
                  {breedLabel(p.breed, p.breed_id) ? <AppText style={styles.rowSubtitle}>{breedLabel(p.breed, p.breed_id)}</AppText> : null}
                </View>
                <ChevronRight size={18} color={Theme.text.muted} />
              </Pressable>
            );
          })}
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/pet", params: { id: "new" } })}
            style={({ pressed }) => [styles.listRow, styles.addRow, pressed && { backgroundColor: Theme.surface.page }]}>
            <View style={[styles.thumb, { backgroundColor: "transparent" }]}><Plus size={22} color={Theme.text.secondary} /></View>
            <AppText style={styles.addT}>{pets.length === 0 ? "Register your pet" : "Add another pet"}</AppText>
          </Pressable>
        </View>

        {/* "Account" es una sola tarjeta agrupada con divisores (Fase 9 de congelación) — mismo componente que Notifications,
            en vez de una tarjeta propia por fila. "Account saved" es su primera fila cuando la cuenta ya tiene correo. */}
        <AppText style={styles.sec}>Account</AppText>
        <View style={[styles.card, { marginBottom: 24 }]}>
          {account.ready && !account.isAnonymous ? (
            <View style={styles.row}>
              <AppText style={styles.rowTitle}>Account saved</AppText>
              <AppText style={styles.rowSubtitle} numberOfLines={1}>{account.email}</AppText>
            </View>
          ) : null}
          <View style={account.ready && !account.isAnonymous ? styles.divider : undefined}>
            <NavRow grouped title="Edit profile" subtitle="Name, photo and contact details" onPress={() => router.push("/edit-profile")} />
          </View>
          <View style={styles.divider}>
            <NavRow grouped title="Privacy" subtitle="What others can see and what stays private" onPress={() => router.push("/privacy")} />
          </View>
          <View style={styles.divider}>
            <NavRow grouped title="Help and FAQ" onPress={() => router.push("/help")} />
          </View>
        </View>

        <Button variant="secondary" label="Log out" onPress={confirmLogout} />
        <Pressable accessibilityRole="button" onPress={() => router.push("/delete-account")} style={styles.deleteLink}>
          <AppText style={styles.deleteT}>Delete account</AppText>
        </Pressable>

        {/* ⚠️ HERRAMIENTA DE DISEÑO — quitar o desactivar antes de publicar. Controlada por EXPO_PUBLIC_SHOW_DESIGN_TOOLS (no __DEV__),
            para poder revisarla también en builds de EAS Update. "Replay onboarding" nunca toca la cuenta real: ver state/onboardingPreview.tsx. */}
        {SHOW_DESIGN_TOOLS ? (
          <>
            <AppText style={[styles.sec, { marginTop: 32 }]}>Design tools</AppText>
            <NavRow title="Replay onboarding" subtitle="Preview only — doesn't affect your account or data" onPress={() => { preview.start(); router.push("/(onboarding)"); }} />
          </>
        ) : null}
      </ScrollView>

      <EditLocationSheet visible={cityOpen} onClose={() => setCityOpen(false)} />
      <SaveAccountSheet visible={saveOpen} mode="save" onClose={() => setSaveOpen(false)} onDone={(email) => { setSaveOpen(false); snackbar.show({ message: `Account saved with ${email}` }); }} />
    </View>
  );
}

// Fila de lista tocable: `grouped` la pone dentro de una tarjeta compartida (Account, Fase 9 de congelación) en vez
// de ser su propia tarjeta con borde (Registered pets, Design tools).
function NavRow({ title, subtitle, onPress, grouped }: { title: string; subtitle?: string; onPress: () => void; grouped?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => [grouped ? [styles.row, styles.rowFlex] : styles.listRow, pressed && { backgroundColor: Theme.surface.page }]}>
      <View style={{ flex: 1 }}>
        <AppText style={styles.rowTitle}>{title}</AppText>
        {subtitle ? <AppText style={styles.rowSubtitle}>{subtitle}</AppText> : null}
      </View>
      <ChevronRight size={18} color={Theme.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.surface.page },
  // El padding horizontal y superior ya los da el contenedor del ScrollView: esta cabecera vive DENTRO de él y se desplaza con el resto.
  titleWrap: { marginBottom: 4 },
  head: { flexDirection: "row", alignItems: "center", gap: 16, paddingBottom: 20, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  name: { ...typography.heading20, color: Theme.text.primary },
  saveCard: { gap: 8, padding: 16, marginBottom: 24, borderRadius: radius.lg, borderWidth: 2, borderColor: Theme.brand.primary, backgroundColor: Theme.surface.card },
  saveT: { ...typography.heading18, color: Theme.text.primary },
  saveS: { ...typography.body14, color: Theme.text.secondary },
  saveBtn: { minHeight: 48, borderRadius: radius.md, backgroundColor: Theme.brand.primary, alignItems: "center", justifyContent: "center", marginTop: 4 },
  saveBtnT: { ...typography.button16, color: Theme.text.onAccent },
  // Label/13 mayúsculas, text/secondary (Fase 10 de congelación — antes usaba text/muted).
  sec: { ...typography.label13, letterSpacing: 0.72, textTransform: "uppercase", color: Theme.text.secondary, marginBottom: 12 },
  card: { borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default, overflow: "hidden" },
  radiusHelp: { ...typography.bodySm13, color: Theme.text.secondary },
  row: { padding: 16 },
  rowFlex: { flexDirection: "row", alignItems: "center", gap: 12 },
  locationT: { flex: 1, ...typography.heading16, color: Theme.text.primary },
  divider: { borderTopWidth: 1, borderTopColor: Theme.border.default },
  listRow: { minHeight: MIN_HIT + 16, flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderColor: Theme.border.default },
  addRow: { borderStyle: "dashed", borderColor: Theme.border.strong },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  // Título de fila de lista navegable: Heading/16. Subtítulo: Body/14 text/secondary (Fase 10 de congelación — antes
  // Caption/12 text/muted). Mismo par para mascotas registradas, NavRow y "Account saved".
  rowTitle: { flexShrink: 1, ...typography.heading16, color: Theme.text.primary },
  rowSubtitle: { ...typography.body14, color: Theme.text.secondary },
  addT: { flex: 1, ...typography.heading16, color: Theme.text.secondary },
  deleteLink: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center", marginTop: 8 },
  deleteT: { ...typography.label14, color: Theme.danger.text, textDecorationLine: "underline" },
});
