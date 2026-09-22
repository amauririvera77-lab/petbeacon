import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { ReportCard } from "../../components/ReportCard";
import { SetupNotice } from "../../components/SetupNotice";
import { useFeed } from "../../hooks/useFeed";
import { useSession } from "../../state/session";
import { C, font, radius } from "../../theme/tokens";

// List (default) y Map con igual jerarquía (CLAUDE.md §7). El mapa real llega en la Fase 4 (Mapbox).
export default function Home() {
  const [view, setView] = useState<"list" | "map">("list");
  const { alertRadiusMi } = useSession();
  const { reports, loading, error, refresh } = useFeed(alertRadiusMi);

  return (
    <TabScreen title="Home">
      <View style={styles.seg} accessibilityRole="tablist">
        {(["list", "map"] as const).map((v) => (
          <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: view === v }} onPress={() => setView(v)}
            style={[styles.segItem, view === v && styles.segOn]}>
            <Text style={[styles.segT, view === v && { color: C.white }]}>{v === "list" ? "List" : "Map"}</Text>
          </Pressable>
        ))}
      </View>

      {view === "map" ? (
        <Placeholder text="Mapbox map with clustering — Phase 4." />
      ) : error === "supabase-not-configured" ? (
        <SetupNotice />
      ) : error ? (
        <View style={styles.errBox}>
          <Text style={styles.errT}>Couldn't load the feed: {error}</Text>
          <Pressable accessibilityRole="button" onPress={refresh} style={styles.retry}><Text style={styles.retryT}>Retry</Text></Pressable>
        </View>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={C.teal} />
      ) : reports.length === 0 ? (
        <Placeholder text={`No activity within ${alertRadiusMi} mi yet.`} />
      ) : (
        <View style={styles.list}>
          {reports.map((r) => <ReportCard key={r.id} report={r} />)}
        </View>
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: "row", backgroundColor: C.border, borderRadius: radius.pill, padding: 3, marginTop: 8, alignSelf: "flex-start" },
  segItem: { minHeight: 40, minWidth: 80, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  segOn: { backgroundColor: C.teal },
  segT: { fontFamily: font.bodyBold, fontSize: 14, color: C.slate700 },
  list: { marginTop: 16, gap: 10 },
  errBox: { marginTop: 16, gap: 8 },
  errT: { fontFamily: font.body, fontSize: 14, color: C.sosDark },
  retry: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.ink },
  retryT: { fontFamily: font.bodyBold, fontSize: 13, color: C.white },
});
