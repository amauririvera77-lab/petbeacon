import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, StyleSheet, View } from "react-native";
import { AppText } from "../../components/AppText";
import { MatchesSheet } from "../../components/MatchesSheet";
import { MyReportStatusCard } from "../../components/MyReportStatusCard";
import { MySightingCard } from "../../components/myreports/MySightingCard";
import { PastReports } from "../../components/myreports/PastReports";
import { ResolveSightingSheet } from "../../components/myreports/ResolveSightingSheet";
import { PinDetailSheet } from "../../components/PinDetailSheet";
import { ReportRow } from "../../components/myreports/ReportRow";
import { useSnackbar } from "../../components/Snackbar";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { useHome } from "../../hooks/useHome";
import { useMyMatches } from "../../hooks/useMyMatches";
import { useMyReports, type MyReport } from "../../hooks/useMyReports";
import type { MyMatch, ReportNearby, SightingResolution } from "../../lib/database.types";
import { sortByRelevance } from "../../lib/matchPick";
import { bucketReports, toNearby } from "../../lib/myReports";
import { shortAddress } from "../../lib/address";
import { agoShort } from "../../lib/time";
import { fetchReportNearby } from "../../lib/reportLookup";
import { reportShareText } from "../../lib/shareText";
import { supabase } from "../../lib/supabase";
import { Theme, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

export default function Reports() {
  const { reports, loading, error, refresh, markReunited } = useMyReports();
  const { matches, refresh: refreshMatches, dismiss, restore } = useMyMatches();
  const center = useHome();
  const snackbar = useSnackbar();
  const [sheetFor, setSheetFor] = useState<{ id: string; name: string } | null>(null);
  const [detail, setDetail] = useState<ReportNearby | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // iOS ignora un Modal que se abre mientras otro se cierra: se espera a que termine la animación.
  const viewSighting = async (m: MyMatch) => {
    const r = await fetchReportNearby(m.sighted_report_id, center.lat, center.lng);
    setSheetFor(null);
    if (r) setTimeout(() => setDetail(r), 400);
  };
  useFocusEffect(useCallback(() => { refresh(); refreshMatches(); }, [refresh, refreshMatches]));

  // Activos: Lost (primero los que tienen coincidencias sin revisar, strong antes que possible; luego por recencia), reunidos hace <24 h y avistamientos
  // vigentes. Todo lo demás va al historial.
  const buckets = useMemo(() => bucketReports(reports), [reports]);
  const lost = useMemo(() => sortByRelevance(buckets.lost, matches), [buckets.lost, matches]);
  const nearby = (r: MyReport) => toNearby(r, center);
  const openDetail = (r: MyReport) => { const n = nearby(r); if (n) setDetail(n); };

  const confirmReunited = (id: string) => {
    const name = reports.find((r) => r.id === id)?.name?.trim() || "your pet";
    Alert.alert(`Did you find ${name}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes, we're reunited", onPress: () => markReunited(id).catch((e) => Alert.alert("Couldn't update", e.message)) },
    ]);
  };
  const share = (r: MyReport) => {
    const n = nearby(r);
    if (n) Share.share({ message: reportShareText(n) }).catch(() => {});
  };
  const editReport = (id: string) => router.push({ pathname: "/edit-report", params: { id } });

  const stillThere = async (id: string) => {
    if (!supabase) return;
    const { error: e } = await supabase.rpc("sighting_still_there", { p_id: id });
    if (e) { Alert.alert("Couldn't update the sighting", e.message); return; }
    snackbar.show({ message: "Marked as still there" });
    refresh();
  };
  const resolve = async (resolution: SightingResolution) => {
    if (!supabase || !resolving) return;
    setBusy(true);
    const { error: e } = await supabase.rpc("resolve_sighting", { p_id: resolving, p_resolution: resolution });
    setBusy(false);
    if (e) { Alert.alert("Couldn't update the sighting", e.message); return; }
    setResolving(null);
    snackbar.show({ message: "Sighting marked as resolved" });
    refresh();
  };

  const hasActive = lost.length + buckets.reunitedRecent.length > 0;
  return (
    <TabScreen title="My Reports" subtitle="Manage your active alerts and logged sightings">
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={Theme.brand.primary} /> : error ? (
        <AppText style={styles.err}>Couldn't load your reports: {error}</AppText>
      ) : (
        <>
          <AppText style={styles.h}>Your lost pets</AppText>
          {!hasActive ? <Placeholder text="No active reports. When you publish an alert it shows up here." /> : (
            <View style={styles.list}>
              {lost.map((r) => (
                <MyReportStatusCard key={r.id} report={r} matches={matches.filter((m) => m.lost_report_id === r.id)}
                  manage={{ onEdit: () => editReport(r.id), onMarkReunited: () => confirmReunited(r.id) }}
                  onOpen={() => openDetail(r)} onShare={() => share(r)} onViewAll={() => setSheetFor({ id: r.id, name: r.name ?? "your pet" })}
                  onViewSighting={(m) => viewSighting(m)} onDismiss={(m) => dismiss(m.id)} />
              ))}
              {buckets.reunitedRecent.map((r) => (
                <Pressable key={r.id} accessibilityRole="button" accessibilityLabel={`${r.name?.trim() || "Unknown " + r.species}, open report`}
                  onPress={() => openDetail(r)} style={({ pressed }) => [styles.reunitedCard, pressed && { opacity: 0.95 }]}>
                  <ReportRow photoUrl={r.photo_url} focusX={r.photo_focus_x} focusY={r.photo_focus_y} species={r.species}
                    title={r.name?.trim() || `Unknown ${r.species}`} badge="reunited"
                    timeText={`Reunited ${agoShort(r.reunited_at ?? r.created_at)}`} locationText={shortAddress(r.location_label) ?? "Location not shared"} />
                  <AppText style={styles.closed}>Case closed — thanks for updating it.</AppText>
                </Pressable>
              ))}
            </View>
          )}
          <AppText style={[styles.h, { marginTop: 20 }]}>Sightings you've logged</AppText>
          {buckets.sightings.length === 0 ? <Placeholder text="Sightings you report will show up here." /> : (
            <View style={styles.list}>
              {buckets.sightings.map((r) => { const n = nearby(r); return n ? (
                <MySightingCard key={r.id} report={n} onOpen={() => setDetail(n)} onEdit={() => editReport(r.id)} onStillThere={() => stillThere(r.id)} onResolve={() => setResolving(r.id)} />
              ) : null; })}
            </View>
          )}
          <PastReports reports={buckets.past} />
        </>
      )}
      <MatchesSheet lostName={sheetFor?.name ?? ""} matches={sheetFor ? matches.filter((m) => m.lost_report_id === sheetFor.id) : null}
        onClose={() => setSheetFor(null)} onView={viewSighting} onDismiss={dismiss} onRestore={restore} />
      <PinDetailSheet report={detail} mine onClose={() => setDetail(null)} onMarkReunited={(r) => confirmReunited(r.id)}
        matchCount={detail ? matches.filter((m) => m.lost_report_id === detail.id && !m.dismissed).length : undefined}
        onReviewMatches={(r) => { setDetail(null); setTimeout(() => setSheetFor({ id: r.id, name: r.name ?? "your pet" }), 400); }} />
      <ResolveSightingSheet visible={!!resolving} busy={busy} onClose={() => setResolving(null)} onPick={resolve} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  h: { ...typography.heading18, color: Theme.text.primary, marginTop: 12 },
  list: { gap: 10, marginTop: 4 },
  err: { ...typography.body14, color: Theme.danger.text, marginTop: 16 },
  reunitedCard: { gap: 6, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card },
  closed: { ...typography.label13, color: Theme.status.reunited.bg },
});
