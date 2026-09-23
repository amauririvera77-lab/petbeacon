import { useFocusEffect } from "expo-router";
import { List, Map as MapIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EnableAlertsCard } from "../../components/EnableAlertsCard";
import { HomeHeader } from "../../components/HomeHeader";
import { MapRadiusChip } from "../../components/MapRadiusChip";
import { MatchBanner } from "../../components/MatchBanner";
import { MapboxWebView, MapSelection } from "../../components/map/MapboxWebView";
import { NotificationsSheet } from "../../components/NotificationsSheet";
import { OfflineBanner } from "../../components/OfflineBanner";
import { FeaturedResourceCard } from "../../components/ResourceCard";
import { ResourceModal, ResourceSheetMode } from "../../components/ResourceModal";
import { ReportCard } from "../../components/ReportCard";
import { SetupNotice } from "../../components/SetupNotice";
import { Placeholder } from "../../components/TabScreen";
import type { ResourceNearby } from "../../lib/database.types";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useFeed } from "../../hooks/useFeed";
import { useHome } from "../../hooks/useHome";
import { useMyMatches } from "../../hooks/useMyMatches";
import { useMyReports } from "../../hooks/useMyReports";
import { useNotificationsFeed } from "../../hooks/useNotificationsFeed";
import { useResources } from "../../hooks/useResources";
import { useSession } from "../../state/session";
import { C, FAB_SIZE, font, radius } from "../../theme/tokens";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// List (default) y Map con igual jerarquía (CLAUDE.md §7); ambos leen los mismos datos y el mismo radio.
export default function Home() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<"list" | "map">("list");
  const [selected, setSelected] = useState<MapSelection>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sheetResource, setSheetResource] = useState<ResourceNearby | null>(null);
  const [sheetMode, setSheetMode] = useState<ResourceSheetMode>("detail");
  const openResource = (r: ResourceNearby) => { setSheetMode("detail"); setSheetResource(r); };
  const { alertRadiusMi, notifSeenAt, update } = useSession();
  const uid = useAuthUser();
  const center = useHome();
  const { reports, loading, error, refresh } = useFeed(alertRadiusMi, center.lat, center.lng);
  const resources = useResources(alertRadiusMi, center.lat, center.lng);
  const { matches, refresh: refreshMatches, dismiss } = useMyMatches();
  const banner = matches.find((m) => !m.dismissed);
  const featured = resources.find((r) => r.is_featured_event) ?? null;
  const { reports: myReports, refresh: refreshMine } = useMyReports();

  // Solo novedades de otros usuarios (lo propio no es una notificación).
  const mineIds = new Set(myReports.map((r) => r.id));
  const others = reports.filter((r) => !mineIds.has(r.id));
  const { items, unread } = useNotificationsFeed(others, matches, uid, notifSeenAt);

  // Al volver de publicar un reporte, el feed se actualiza sin tener que reiniciar la app.
  useFocusEffect(useCallback(() => { refresh(); refreshMatches(); refreshMine(); }, [refresh, refreshMatches, refreshMine]));

  const selReport = selected?.kind === "report" ? reports.find((r) => r.id === selected.id) : undefined;

  // Abrir la hoja limpia el badge (CLAUDE.md §2).
  const openNotifs = () => { setNotifOpen(true); update({ notifSeenAt: Date.now() }); };
  const pickNotif = (reportId: string) => { setNotifOpen(false); setSelected({ kind: "report", id: reportId }); setView("map"); };

  const switcher = (
    <View style={styles.segBar} accessibilityRole="tablist">
      {([["list", "List", List], ["map", "Map", MapIcon]] as const).map(([v, label, Icon]) => {
        const on = view === v;
        return (
          <Pressable key={v} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setView(v)} style={[styles.segItem, on && styles.segOn]}>
            <Icon size={16} color={on ? C.white : C.slate700} />
            <Text style={[styles.segT, on && { color: C.white }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <HomeHeader unread={unread} onBell={openNotifs} />
        {switcher}
      </View>
      <OfflineBanner />

      {view === "map" ? (
        <View style={styles.mapWrap}>
          {!MAPBOX_TOKEN ? (
            <View style={styles.pad}><SetupNotice what="Mapbox" vars="EXPO_PUBLIC_MAPBOX_TOKEN" /></View>
          ) : error === "supabase-not-configured" ? (
            <View style={styles.pad}><SetupNotice /></View>
          ) : (
            <>
              <MapboxWebView token={MAPBOX_TOKEN} reports={reports} resources={resources} center={center} radiusMi={alertRadiusMi} onSelect={(sel) => { if (sel?.kind === "resource") { const r = resources.find((x) => x.id === sel.id); if (r) return openResource(r); } setSelected(sel); }} />
              <MapRadiusChip value={alertRadiusMi} onChange={(mi) => { setSelected(null); update({ alertRadiusMi: mi }); }} />
              {selReport ? (
                <View style={styles.sheet}><ReportCard report={selReport} /></View>
              ) : null}
            </>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listC}>
          <EnableAlertsCard />
          {banner ? (
            <MatchBanner match={banner} onDismiss={() => dismiss(banner.id)} onView={() => pickNotif(banner.sighted_report_id)} />
          ) : null}
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
            <>
              {reports.slice(0, 2).map((r) => <ReportCard key={r.id} report={r} />)}
              {featured ? <FeaturedResourceCard resource={featured} onPress={() => openResource(featured)} /> : null}
              {reports.slice(2).map((r) => <ReportCard key={r.id} report={r} />)}
            </>
          )}
        </ScrollView>
      )}

      <ResourceModal resource={sheetResource} mode={sheetMode} onMode={setSheetMode} onClose={() => setSheetResource(null)} />
      <NotificationsSheet visible={notifOpen} items={items} onClose={() => setNotifOpen(false)} onPick={(n) => pickNotif(n.reportId)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  segBar: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  segItem: { flex: 1, height: 40, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: "#F1F5F9" },
  segOn: { backgroundColor: C.teal },
  segT: { fontFamily: font.bodyBold, fontSize: 14, color: C.slate700 },
  listC: { padding: 16, paddingBottom: 200, gap: 10 },
  mapWrap: { flex: 1 },
  pad: { padding: 16 },
  // Deja libre la esquina inferior derecha para el FAB (73px + 16px de margen).
  sheet: { position: "absolute", left: 12, right: FAB_SIZE + 28, bottom: 12, backgroundColor: C.white, borderRadius: radius.lg, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  errBox: { gap: 8 },
  errT: { fontFamily: font.body, fontSize: 14, color: C.sosDark },
  retry: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.ink },
  retryT: { fontFamily: font.bodyBold, fontSize: 13, color: C.white },
});
