import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { MatchesSheet } from "../../components/MatchesSheet";
import { MyReportCard } from "../../components/MyReportCard";
import { PinDetailSheet } from "../../components/PinDetailSheet";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { useHome } from "../../hooks/useHome";
import { useMyMatches } from "../../hooks/useMyMatches";
import type { MyMatch, ReportNearby } from "../../lib/database.types";
import { fetchReportNearby } from "../../lib/reportLookup";
import { useMyReports } from "../../hooks/useMyReports";
import { C, font } from "../../theme/tokens";

const DAY = 24 * 3_600_000;

export default function Reports() {
  const { reports, loading, error, refresh, markReunited } = useMyReports();
  const { matches, refresh: refreshMatches, dismiss, restore } = useMyMatches();
  const center = useHome();
  const [sheetFor, setSheetFor] = useState<{ id: string; name: string } | null>(null);
  const [sighting, setSighting] = useState<ReportNearby | null>(null);
  // iOS ignora un Modal que se abre mientras otro se cierra: se espera a que termine la animación.
  const viewSighting = async (m: MyMatch) => {
    const r = await fetchReportNearby(m.sighted_report_id, center.lat, center.lng);
    setSheetFor(null);
    if (r) setTimeout(() => setSighting(r), 400);
  };
  useFocusEffect(useCallback(() => { refresh(); refreshMatches(); }, [refresh, refreshMatches]));

  // Lost activos + reunited de las últimas 24h; los avistamientos van en su propia sección (§2).
  const active = reports.filter((r) => r.status === "lost" || (r.status === "reunited" && r.reunited_at && Date.now() - new Date(r.reunited_at).getTime() < DAY));
  const sightings = reports.filter((r) => r.status === "sighted");
  const countFor = (id: string) => matches.filter((m) => m.lost_report_id === id).length;

  const confirmReunited = (id: string) => {
    const name = reports.find((r) => r.id === id)?.name?.trim() || "your pet";
    Alert.alert(`Did you find ${name}?`, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: "Yes, we're reunited", onPress: () => markReunited(id).catch((e) => Alert.alert("Couldn't update", e.message)) },
    ]);
  };

  return (
    <TabScreen title="My reports" subtitle="Manage your active alerts and logged sightings">
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={C.teal} /> : error ? (
        <Text style={styles.err}>Couldn't load your reports: {error}</Text>
      ) : (
        <>
          <Text style={styles.h}>Active reports</Text>
          {active.length === 0 ? <Placeholder text="No active reports. When you publish an alert it shows up here." /> : (
            <View style={styles.list}>
              {active.map((r) => <MyReportCard key={r.id} report={r} matchCount={countFor(r.id)} onMatches={() => setSheetFor({ id: r.id, name: r.name ?? "your pet" })} onEdit={() => router.push({ pathname: "/edit-report", params: { id: r.id } })} onMarkReunited={() => confirmReunited(r.id)} />)}
            </View>
          )}
          <Text style={[styles.h, { marginTop: 20 }]}>Sightings you've logged</Text>
          {sightings.length === 0 ? <Placeholder text="Sightings you report will show up here." /> : (
            <View style={styles.list}>{sightings.map((r) => <MyReportCard key={r.id} report={r} matchCount={0} />)}</View>
          )}
        </>
      )}
      <MatchesSheet lostName={sheetFor?.name ?? ""} matches={sheetFor ? matches.filter((m) => m.lost_report_id === sheetFor.id) : null}
        onClose={() => setSheetFor(null)} onView={viewSighting} onDismiss={dismiss} onRestore={restore} />
      <PinDetailSheet report={sighting} onClose={() => setSighting(null)} />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  h: { fontFamily: font.head, fontSize: 18, color: C.ink, marginTop: 12 },
  list: { gap: 10, marginTop: 4 },
  err: { fontFamily: font.body, fontSize: 14, color: C.sosDark, marginTop: 16 },
});
