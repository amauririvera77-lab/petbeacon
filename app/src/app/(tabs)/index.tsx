import { useFocusEffect } from "expo-router";
import { List, Map as MapIcon } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EnableAlertsCard } from "../../components/EnableAlertsCard";
import { HomeHeader } from "../../components/HomeHeader";
import { ALL_FILTERS, MapFilters, type MapFilterState } from "../../components/MapFilters";
import { MapRadiusChip } from "../../components/MapRadiusChip";
import { PinDetailSheet } from "../../components/PinDetailSheet";
import { MatchBanner } from "../../components/MatchBanner";
import { MapboxWebView } from "../../components/map/MapboxWebView";
import { useSnackbar } from "../../components/Snackbar";
import { NotificationsSheet } from "../../components/NotificationsSheet";
import { OfflineBanner } from "../../components/OfflineBanner";
import { FeaturedResourceCard } from "../../components/ResourceCard";
import { ResourceModal, ResourceSheetMode } from "../../components/ResourceModal";
import { ReportCard } from "../../components/ReportCard";
import { SetupNotice } from "../../components/SetupNotice";
import { Placeholder } from "../../components/TabScreen";
import type { ReportNearby, ResourceNearby } from "../../lib/database.types";
import { fetchReportNearby } from "../../lib/reportLookup";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useFeed } from "../../hooks/useFeed";
import { useHome } from "../../hooks/useHome";
import { useMyPosition } from "../../hooks/useMyPosition";
import { useMyMatches } from "../../hooks/useMyMatches";
import { useMyReports } from "../../hooks/useMyReports";
import { useNotificationsFeed } from "../../hooks/useNotificationsFeed";
import { useResourcesState } from "../../hooks/useResources";
import { useSession } from "../../state/session";
import { C, font, radius } from "../../theme/tokens";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// List (default) y Map con igual jerarquía (CLAUDE.md §7); ambos leen los mismos datos y el mismo radio.
export default function Home() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<"list" | "map">("list");
  const [pinReport, setPinReport] = useState<ReportNearby | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [filters, setFilters] = useState<MapFilterState>(ALL_FILTERS);
  const [sheetResource, setSheetResource] = useState<ResourceNearby | null>(null);
  const [sheetMode, setSheetMode] = useState<ResourceSheetMode>("detail");
  const openResource = (r: ResourceNearby) => { setSheetMode("detail"); setSheetResource(r); };
  const { alertRadiusMi, notifSeenAt, update } = useSession();
  const uid = useAuthUser();
  const center = useHome();
  const me = useMyPosition(view === "map");
  const { reports, loading, error, refresh } = useFeed(alertRadiusMi, center.lat, center.lng);
  const { resources, refresh: refreshResources } = useResourcesState(alertRadiusMi, center.lat, center.lng);
  const { matches, refresh: refreshMatches, dismiss, restore } = useMyMatches();
  const snackbar = useSnackbar();
  const banner = matches.find((m) => !m.dismissed);
  // Los filtros solo afectan a los pines del mapa (memoizado: un array nuevo en cada render reenviaría los datos al WebView).
  const mapReports = useMemo(() => reports.filter((r) => filters[r.status]), [reports, filters]);
  const featured = resources.find((r) => r.is_featured_event) ?? null;
  const { reports: myReports, refresh: refreshMine } = useMyReports();

  // Solo novedades de otros usuarios (lo propio no es una notificación).
  const mineIds = new Set(myReports.map((r) => r.id));
  const others = reports.filter((r) => !mineIds.has(r.id));
  const { items, unread } = useNotificationsFeed(others, matches, uid, notifSeenAt);

  // Al volver de publicar un reporte, el feed se actualiza sin tener que reiniciar la app.
  useFocusEffect(useCallback(() => { refresh(); refreshMatches(); refreshMine(); refreshResources(); }, [refresh, refreshMatches, refreshMine, refreshResources]));


  // Abrir la hoja limpia el badge (CLAUDE.md §2).
  // "View sighting": abre el detalle del avistamiento (del feed, o buscándolo si está fuera de él).
  const viewSighting = async (id: string) => {
    const r = reports.find((x) => x.id === id) ?? (await fetchReportNearby(id, center.lat, center.lng));
    if (r) setPinReport(r);
  };
  const openNotifs = () => { setNotifOpen(true); update({ notifSeenAt: Date.now() }); };
  // iOS ignora un Modal que se abre mientras otro aún se está cerrando: se espera a que termine la animación.
  const pickNotif = (reportId: string) => {
    setNotifOpen(false);
    setView("map");
    const r = reports.find((x) => x.id === reportId);
    if (r) setTimeout(() => setPinReport(r), 400);
  };

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
        {view === "map" ? <MapFilters value={filters} onChange={setFilters} /> : null}
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
              <MapboxWebView token={MAPBOX_TOKEN} reports={mapReports} resources={resources} center={center} radiusMi={alertRadiusMi} me={me} onSelect={(sel) => {
                if (!sel) return;
                if (sel.kind === "resource") { const r = resources.find((x) => x.id === sel.id); if (r) openResource(r); }
                else { const r = reports.find((x) => x.id === sel.id); if (r) setPinReport(r); }
              }} />
              <MapRadiusChip value={alertRadiusMi} onChange={(mi) => update({ alertRadiusMi: mi })} />
            </>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listC}>
          <EnableAlertsCard />
          {banner ? (
            <MatchBanner match={banner} onViewSighting={() => viewSighting(banner.sighted_report_id)}
              onDismiss={() => { dismiss(banner.id); snackbar.show({ message: "Match dismissed", actionLabel: "Undo", onAction: () => restore(banner.id) }); }} />
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
              {reports.slice(0, 2).map((r) => <ReportCard key={r.id} report={r} onPress={() => setPinReport(r)} />)}
              {featured ? <FeaturedResourceCard resource={featured} onPress={() => openResource(featured)} /> : null}
              {reports.slice(2).map((r) => <ReportCard key={r.id} report={r} onPress={() => setPinReport(r)} />)}
            </>
          )}
        </ScrollView>
      )}

      <PinDetailSheet report={pinReport} onClose={() => setPinReport(null)} />
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
  errBox: { gap: 8 },
  errT: { fontFamily: font.body, fontSize: 14, color: C.sosDark },
  retry: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.ink },
  retryT: { fontFamily: font.bodyBold, fontSize: 13, color: C.white },
});
