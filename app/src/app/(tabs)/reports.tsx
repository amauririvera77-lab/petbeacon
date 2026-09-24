import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { MyReportCard } from "../../components/MyReportCard";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { useMyMatches } from "../../hooks/useMyMatches";
import { useMyReports } from "../../hooks/useMyReports";
import { C, font } from "../../theme/tokens";

const DAY = 24 * 3_600_000;

export default function Reports() {
  const { reports, loading, error, refresh, markReunited } = useMyReports();
  const { matches, refresh: refreshMatches } = useMyMatches();
  useFocusEffect(useCallback(() => { refresh(); refreshMatches(); }, [refresh, refreshMatches]));

  // Lost activos + reunited de las últimas 24h; los avistamientos van en su propia sección (§2).
  const active = reports.filter((r) => r.status === "lost" || (r.status === "reunited" && r.reunited_at && Date.now() - new Date(r.reunited_at).getTime() < DAY));
  const sightings = reports.filter((r) => r.status === "sighted");
  const countFor = (id: string) => matches.filter((m) => m.lost_report_id === id).length;

  const confirmReunited = (id: string) =>
    Alert.alert("Mark as reunited?", "This closes the active alert and removes it from the public map.", [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", onPress: () => markReunited(id).catch((e) => Alert.alert("Couldn't update", e.message)) },
    ]);

  return (
    <TabScreen title="My reports" subtitle="Manage your active alerts and logged sightings">
      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={C.teal} /> : error ? (
        <Text style={styles.err}>Couldn't load your reports: {error}</Text>
      ) : (
        <>
          <Text style={styles.h}>Active reports</Text>
          {active.length === 0 ? <Placeholder text="No active reports. When you publish an alert it shows up here." /> : (
            <View style={styles.list}>
              {active.map((r) => <MyReportCard key={r.id} report={r} matchCount={countFor(r.id)} onEdit={() => router.push({ pathname: "/edit-report", params: { id: r.id } })} onMarkReunited={() => confirmReunited(r.id)} />)}
            </View>
          )}
          <Text style={[styles.h, { marginTop: 20 }]}>Sightings you've logged</Text>
          {sightings.length === 0 ? <Placeholder text="Sightings you report will show up here." /> : (
            <View style={styles.list}>{sightings.map((r) => <MyReportCard key={r.id} report={r} matchCount={0} />)}</View>
          )}
        </>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  h: { fontFamily: font.head, fontSize: 18, color: C.ink, marginTop: 12 },
  list: { gap: 10, marginTop: 4 },
  err: { fontFamily: font.body, fontSize: 14, color: C.sosDark, marginTop: 16 },
});
