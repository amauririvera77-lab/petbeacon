import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { MapboxWebView, MapSelection } from "../../components/map/MapboxWebView";
import { MapRadiusChip } from "../../components/MapRadiusChip";
import { ReportCard } from "../../components/ReportCard";
import { SetupNotice } from "../../components/SetupNotice";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { useFeed } from "../../hooks/useFeed";
import { useResources } from "../../hooks/useResources";
import { DEFAULT_CENTER } from "../../lib/geo";
import { useSession } from "../../state/session";
import { C, FAB_SIZE, font, radius } from "../../theme/tokens";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// List (default) y Map con igual jerarquía (CLAUDE.md §7); ambos leen los mismos datos y el mismo radio.
export default function Home() {
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<MapSelection>(null);
  const { alertRadiusMi, update } = useSession();
  const { reports, loading, error, refresh } = useFeed(alertRadiusMi);
  const resources = useResources(alertRadiusMi);

  const selReport = selected?.kind === "report" ? reports.find((r) => r.id === selected.id) : undefined;
  const selResource = selected?.kind === "resource" ? resources.find((r) => r.id === selected.id) : undefined;

  const switcher = (
    <View style={styles.seg} accessibilityRole="tablist">
      {(["list", "map"] as const).map((v) => (
        <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: view === v }} onPress={() => setView(v)}
          style={[styles.segItem, view === v && styles.segOn]}>
          <Text style={[styles.segT, view === v && { color: C.white }]}>{v === "list" ? "List" : "Map"}</Text>
        </Pressable>
      ))}
    </View>
  );

  if (view === "map") {
    return (
      <TabScreen title="Home" scroll={false}>
        <View style={styles.segRow}>{switcher}</View>
        <View style={styles.mapWrap}>
          {!MAPBOX_TOKEN ? (
            <View style={styles.pad}><SetupNotice what="Mapbox" vars="EXPO_PUBLIC_MAPBOX_TOKEN" /></View>
          ) : error === "supabase-not-configured" ? (
            <View style={styles.pad}><SetupNotice /></View>
          ) : (
            <>
              <MapboxWebView
                token={MAPBOX_TOKEN}
                reports={reports}
                resources={resources}
                center={DEFAULT_CENTER}
                radiusMi={alertRadiusMi}
                onSelect={setSelected}
              />
              <MapRadiusChip value={alertRadiusMi} onChange={(mi) => { setSelected(null); update({ alertRadiusMi: mi }); }} />
              {selReport ? (
                <View style={styles.sheet}><ReportCard report={selReport} /></View>
              ) : selResource ? (
                <View style={[styles.sheet, styles.resCard]}>
                  <Text style={styles.resKind}>Community resource</Text>
                  <Text style={styles.resName}>{selResource.name}</Text>
                  <Text style={styles.resDesc} numberOfLines={2}>{selResource.description}</Text>
                  <Text style={styles.resMeta}>{selResource.distance_mi.toFixed(1)} mi away</Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </TabScreen>
    );
  }

  return (
    <TabScreen title="Home">
      {switcher}
      {error === "supabase-not-configured" ? (
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
  segRow: { paddingHorizontal: 16, paddingBottom: 8 },
  segItem: { minHeight: 40, minWidth: 80, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  segOn: { backgroundColor: C.teal },
  segT: { fontFamily: font.bodyBold, fontSize: 14, color: C.slate700 },
  list: { marginTop: 16, gap: 10 },
  mapWrap: { flex: 1 },
  pad: { padding: 16 },
  // Deja libre la esquina inferior derecha para el FAB (73px + 16px de margen).
  sheet: { position: "absolute", left: 12, right: FAB_SIZE + 28, bottom: 12, backgroundColor: C.white, borderRadius: radius.lg, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  resCard: { padding: 14, gap: 3 },
  resKind: { fontFamily: font.bodyBold, fontSize: 11, color: C.info, textTransform: "uppercase", letterSpacing: 0.5 },
  resName: { fontFamily: font.head, fontSize: 16, color: C.ink },
  resDesc: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700 },
  resMeta: { fontFamily: font.bodySemi, fontSize: 12, color: C.slate500 },
  errBox: { marginTop: 16, gap: 8 },
  errT: { fontFamily: font.body, fontSize: 14, color: C.sosDark },
  retry: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.ink },
  retryT: { fontFamily: font.bodyBold, fontSize: 13, color: C.white },
});
