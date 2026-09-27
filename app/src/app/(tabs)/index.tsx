import { router, useFocusEffect } from "expo-router";
import { LocateFixed, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EditLocationSheet } from "../../components/EditLocationSheet";
import { EndOfFeed } from "../../components/EndOfFeed";
import { EmptyState } from "../../components/EmptyState";
import { LocationOffStrip } from "../../components/LocationOffStrip";
import { NewReportsPill } from "../../components/NewReportsPill";
import { ReportCardSkeleton } from "../../components/ReportCardSkeleton";
import { EnableAlertsCard } from "../../components/EnableAlertsCard";
import { HomeHeader } from "../../components/HomeHeader";
import { ActiveFilters } from "../../components/ActiveFilters";
import { CompactSegmented } from "../../components/CompactSegmented";
import { FilterButton } from "../../components/FilterButton";
import { FilterSheet } from "../../components/FilterSheet";
import { MapRadiusChip } from "../../components/MapRadiusChip";
import { PinDetailSheet } from "../../components/PinDetailSheet";
import { MatchesSheet } from "../../components/MatchesSheet";
import { MyReportCarousel } from "../../components/MyReportCarousel";
import { MapboxWebView, type MapHandle } from "../../components/map/MapboxWebView";
import { useSnackbar } from "../../components/Snackbar";
import { ReunitedCelebration } from "../../components/ReunitedCelebration";
import { NotificationsSheet } from "../../components/NotificationsSheet";
import { OfflineBanner } from "../../components/OfflineBanner";
import { CommunityResourceCard } from "../../components/ResourceCard";
import { SearchBar } from "../../components/SearchBar";
import { SortControl } from "../../components/SortControl";
import { StatusChips } from "../../components/StatusChips";
import { ResourceModal, ResourceSheetMode } from "../../components/ResourceModal";
import { ReportCard } from "../../components/ReportCard";
import { SetupNotice } from "../../components/SetupNotice";
import type { ReportNearby, ResourceNearby } from "../../lib/database.types";
import { matchNamesBySighting, sortByRelevance } from "../../lib/matchPick";
import { fetchReportNearby } from "../../lib/reportLookup";
import { useAuthUser } from "../../hooks/useAuthUser";
import { useFeed } from "../../hooks/useFeed";
import { useLocationPermission } from "../../hooks/useLocationPermission";
import { useHome } from "../../hooks/useHome";
import { useMyPosition } from "../../hooks/useMyPosition";
import { useNow } from "../../hooks/useNow";
import { useMyMatches } from "../../hooks/useMyMatches";
import { useMyReports } from "../../hooks/useMyReports";
import { useNotificationsFeed } from "../../hooks/useNotificationsFeed";
import { useResourcesState } from "../../hooks/useResources";
import { geocode, type Place } from "../../lib/geocode";
import { activeFilterCount, applyHomeFilters, mapEventResources } from "../../lib/homeFilters";
import { nextRadius } from "../../lib/radius";
import { reportShareText } from "../../lib/shareText";
import { sortReports } from "../../lib/sort";
import { useFab } from "../../state/fab";
import { useFabScroll } from "../../hooks/useFabScroll";
import { useHomePrefs, type ViewRadius } from "../../state/homePrefs";
import { useSession } from "../../state/session";
import { C, FAB_CLEARANCE, font, radius } from "../../theme/tokens";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// List (default) y Map con igual jerarquía (CLAUDE.md §7); ambos leen los mismos datos y el mismo radio.
export default function Home() {
  const insets = useSafeAreaInsets();
  const [pinReport, setPinReport] = useState<ReportNearby | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focus, setFocus] = useState<Place | null>(null); // zona buscada en el mapa
  const [sheetResource, setSheetResource] = useState<ResourceNearby | null>(null);
  const [sheetMode, setSheetMode] = useState<ResourceSheetMode>("detail");
  const openResource = (r: ResourceNearby) => { setSheetMode("detail"); setSheetResource(r); };
  const { city, alertRadiusMi, notifSeenAt, update } = useSession();
  const mapRef = useRef<MapHandle>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { prefs, setPrefs, setSort, resetFilters, resetAll, listQuery, setListQuery, mapQuery, setMapQuery, view, setView } = useHomePrefs();
  const { collapsed: fabCollapsed, setCollapsed } = useFab();
  const uid = useAuthUser();
  const center = useHome();
  const { pos: me, status: posStatus } = useMyPosition(view === "map");
  const { status: locPerm, recheck: recheckLoc } = useLocationPermission();
  const [locDismissed, setLocDismissed] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pulling, setPulling] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  // El polling y las coincidencias se refrescan juntos; `onPoll` se completa más abajo (los callbacks vienen de hooks posteriores).
  const pollRef = useRef<() => void>(() => {});
  const { reports, loading, error, lastUpdated, failed, pending, applyPending, refresh } = useFeed(prefs.viewRadiusMi, center.lat, center.lng, { poll: focused, onPoll: () => pollRef.current() });
  const { resources, refresh: refreshResources } = useResourcesState(prefs.viewRadiusMi, center.lat, center.lng);
  const { matches, refresh: refreshMatches, dismiss, restore } = useMyMatches();
  const snackbar = useSnackbar();
  // Mismos filtros en List y Map (fase 5.3); la búsqueda de texto solo filtra la lista (en el mapa es una dirección).
  // Memoizado: un array nuevo en cada render reenviaría los datos al WebView.
  const { reports: myReports, refresh: refreshMine, markReunited } = useMyReports();
  // El feed NO repite tus Lost activos (ya están en la tarjeta de estado de arriba); siguen en el mapa y en My Reports. Tus avistamientos sí salen.
  const ownLostIds = useMemo(() => new Set(myReports.filter((r) => r.status === "lost").map((r) => r.id)), [myReports]);
  const feedReports = useMemo(() => reports.filter((r) => !ownLostIds.has(r.id)), [reports, ownLostIds]);
  const listFiltered = useMemo(() => applyHomeFilters(feedReports, prefs, listQuery), [feedReports, prefs, listQuery]);
  const mapReports = useMemo(() => applyHomeFilters(reports, prefs), [reports, prefs]);
  // Eventos vigentes (en curso, hoy o futuros): el reloj se refresca solo, así un evento desaparece del mapa y del feed al pasar su hora de fin.
  // La lista se memoiza por ids: un array nuevo en cada tick reenviaría los datos al WebView sin que nada cambie.
  const now = useNow();
  const events = mapEventResources(resources, now);
  const eventsKey = events.map((r) => r.id).join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mapResources = useMemo(() => events, [eventsKey, resources]);
  const featured = events[0] ?? null;
  // Avistamientos que coinciden con un Lost tuyo (no descartadas): etiqueta en el feed e indicador del pin.
  const matchNames = useMemo(() => matchNamesBySighting(matches), [matches]);
  // Orden elegido (persiste al cambiar List/Map y al volver a la Home). Por defecto: más recientes primero.
  // Tarjeta de vista previa del pin tocado (misma ReportCard del feed); si un filtro lo oculta, desaparece sola.
  const preview = useMemo(() => mapReports.find((r) => r.id === previewId) ?? null, [mapReports, previewId]);
  const sorted = useMemo(() => sortReports(listFiltered, prefs.sort), [listFiltered, prefs.sort]);
  // El recurso comunitario va al final del feed o, como máximo, tras 9 reportes: nunca entre los primeros resultados.
  const resourceAt = Math.min(9, sorted.length);
  const [celebrate, setCelebrate] = useState<{ id: string; name: string } | null>(null);
  const endCelebration = useCallback(() => setCelebrate(null), []);
  const activeLost = useMemo(() => sortByRelevance(myReports.filter((r) => r.status === "lost"), matches), [myReports, matches]);
  const mineIds = useMemo(() => myReports.map((r) => r.id), [myReports]);
  const [matchesFor, setMatchesFor] = useState<{ id: string; name: string } | null>(null);
  const filterCount = activeFilterCount(prefs);

  // Mismo comportamiento del FAB que el resto de la app (se contrae al bajar, se expande al subir y al entrar a la pantalla).
  const { onScroll, reset: resetFab } = useFabScroll();
  useEffect(() => { if (view !== "map") { setPreviewId(null); resetFab(); } }, [view, resetFab]);
  // En Map el FAB va expandido, salvo con la tarjeta de vista previa abierta: se contrae al círculo para no taparla.
  useEffect(() => { if (view === "map") setCollapsed(preview !== null); }, [view, preview, setCollapsed]);

  // D.6: al bajar la lista la búsqueda se contrae (misma señal de scroll que el FAB) y quedan fijos chips y List/Map; al subir reaparece.
  // Con texto en la búsqueda NO se contrae, y en Map siempre está visible.
  const hideSearch = view === "list" && fabCollapsed && listQuery.trim() === "";
  const searchAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(searchAnim, { toValue: hideSearch ? 0 : 1, duration: 180, useNativeDriver: false }).start();
  }, [hideSearch, searchAnim]);

  // Búsqueda de zona o dirección (modo Map): geocodifica cerca de tu centro y la cámara vuela allí.
  const searchMap = async () => {
    const q = mapQuery.trim();
    if (!q) { setFocus(null); return; }
    try {
      const res = await geocode(q, city, center);
      if (res[0]) setFocus(res[0]);
      else snackbar.show({ message: "We couldn't find that place" });
    } catch { snackbar.show({ message: "Search failed. Check your connection." }); }
  };
  const changeMapQuery = (q: string) => { setMapQuery(q); if (!q.trim()) setFocus(null); };

  // Solo novedades de otros usuarios (lo propio no es una notificación). Incluye lo detectado por el polling aunque aún no se haya
  // mostrado en la lista: así el badge de la campana y la píldora "new reports" cuentan lo mismo (fase 6.7).
  pollRef.current = () => { refreshMatches(); refreshMine(); };
  const newOnes = useMemo(() => {
    if (!pending) return [];
    const have = new Set(reports.map((r) => r.id));
    return pending.filter((r) => !have.has(r.id) && !mineIds.includes(r.id));
  }, [pending, reports, mineIds]);
  const newVisible = useMemo(() => applyHomeFilters(newOnes, prefs, view === "list" ? listQuery : "").length, [newOnes, prefs, listQuery, view]);
  const others = useMemo(() => [...reports.filter((r) => !mineIds.includes(r.id)), ...newOnes], [reports, mineIds, newOnes]);
  const showNew = () => { applyPending(); if (view === "list") scrollRef.current?.scrollTo({ y: 0, animated: true }); };
  // Deslizar hacia abajo en la lista: refresca todo y muestra el indicador hasta terminar.
  const onPull = async () => {
    setPulling(true);
    await Promise.allSettled([refresh(), refreshMatches(), refreshMine(), refreshResources()]);
    setPulling(false);
  };
  // Radio siguiente (1 → 5 → 10) para el botón "Expand" de los estados vacíos.
  const nextR = nextRadius(prefs.viewRadiusMi);
  const noReportsInRadius = !loading && !error && reports.length === 0;
  const emptyRadiusProps = nextR
    ? { title: `No reports within ${prefs.viewRadiusMi} mi`, body: "Nothing has been reported in this area recently.", actionLabel: `Expand to ${nextR} mi`, onAction: () => setPrefs({ viewRadiusMi: nextR as ViewRadius }) }
    : { title: "No reports within 10 mi", body: "Nothing has been reported nearby recently. We'll alert you when something is." };
  const { items, unread } = useNotificationsFeed(others, matches, uid, notifSeenAt);

  // Al volver de publicar un reporte, el feed se actualiza sin tener que reiniciar la app.
  useFocusEffect(useCallback(() => {
    setFocused(true); recheckLoc();
    refresh(); refreshMatches(); refreshMine(); refreshResources();
    return () => setFocused(false);
  }, [refresh, refreshMatches, refreshMine, refreshResources, recheckLoc]));


  // Abrir la hoja limpia el badge (CLAUDE.md §2).
  // El dueño confirmó que se reunieron: el reporte pasa a `reunited` (deja de ser Lost en feed y mapa; el matching y los avisos solo
  // consideran Lost activos, así que se detienen) y la tarjeta de estado muestra una celebración antes de desaparecer.
  const onMarkReunited = async (r: ReportNearby) => {
    try {
      await markReunited(r.id);
      setCelebrate({ id: r.id, name: r.name?.trim() || "your pet" });
      refresh();
    } catch (e) {
      Alert.alert("Couldn't update your report", e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  };

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

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top, backgroundColor: C.white }}>
        <HomeHeader unread={unread} onBell={openNotifs} />
        <View style={styles.controls}>
          <Animated.View style={{ height: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 54] }), opacity: searchAnim, overflow: "hidden" }} pointerEvents={hideSearch ? "none" : "auto"}>
          <SearchBar
            value={view === "map" ? mapQuery : listQuery} onChange={view === "map" ? changeMapQuery : setListQuery} onSubmit={view === "map" ? searchMap : undefined}
            placeholder={view === "map" ? "Search an area or address" : "Search breed, color or name"} />
          </Animated.View>
          <View style={styles.chipRow}>
            <StatusChips lost={prefs.lost} sighted={prefs.sighted} onToggle={(k) => setPrefs({ [k]: !prefs[k] })} />
            <View style={styles.rightCluster}>
              <FilterButton count={filterCount} onPress={() => setFiltersOpen(true)} />
              <CompactSegmented value={view} onChange={setView} />
            </View>
          </View>
          <ActiveFilters prefs={prefs} onChange={setPrefs} onClearAll={resetFilters} />
        </View>
      </View>
      <OfflineBanner lastUpdated={lastUpdated ?? null} failed={failed && !error} onRetry={refresh} />
      {locPerm === "denied" && !locDismissed ? <LocationOffStrip onSetZone={() => setZoneOpen(true)} onDismiss={() => setLocDismissed(true)} /> : null}

      <View style={{ flex: 1 }}>
      {view === "map" ? (
        <View style={styles.mapWrap}>
          {!MAPBOX_TOKEN ? (
            <View style={styles.pad}><SetupNotice what="Mapbox" vars="EXPO_PUBLIC_MAPBOX_TOKEN" /></View>
          ) : error === "supabase-not-configured" ? (
            <View style={styles.pad}><SetupNotice /></View>
          ) : (
            <>
              <MapboxWebView ref={mapRef} alertRadiusMi={alertRadiusMi} selectedId={preview?.id ?? null} token={MAPBOX_TOKEN} reports={mapReports} resources={mapResources} center={center} radiusMi={prefs.viewRadiusMi} me={me} mineIds={mineIds} matchNames={matchNames} focus={focus} onSelect={(sel) => {
                if (!sel) { setPreviewId(null); return; }
                if (sel.kind === "resource") { setPreviewId(null); const r = mapResources.find((x) => x.id === sel.id); if (r) openResource(r); }
                else setPreviewId(sel.id);
              }} />
              {posStatus === "finding" ? (
                <View style={styles.finding} accessibilityLiveRegion="polite">
                  <ActivityIndicator size="small" color={C.ink} />
                  <Text style={styles.findingT}>Finding your location…</Text>
                </View>
              ) : null}
              {error ? (
                <EmptyState style={styles.mapEmpty} title="We couldn't load reports" body="Check your connection and try again." actionLabel="Try again" onAction={refresh} />
              ) : noReportsInRadius && !preview ? (
                <EmptyState style={styles.mapEmpty} {...emptyRadiusProps} />
              ) : !loading && reports.length > 0 && mapReports.length === 0 ? (
                <EmptyState style={styles.mapEmpty} title="No reports match your filters" actionLabel="Reset filters" onAction={resetAll} />
              ) : null}
              <MapRadiusChip value={prefs.viewRadiusMi} onChange={(mi) => setPrefs({ viewRadiusMi: mi as ViewRadius })} />
              <Pressable accessibilityRole="button" accessibilityLabel="Center map on my location" onPress={() => mapRef.current?.recenter()} style={styles.recenter}>
                <LocateFixed size={22} color={C.ink} />
              </Pressable>
              {preview ? (
                <View style={styles.preview}>
                  <ReportCard report={preview} mine={mineIds.includes(preview.id)} matchFor={matchNames[preview.id]} onPress={() => setPinReport(preview)} />
                </View>
              ) : null}
              {focus ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear searched area" onPress={() => { setFocus(null); setMapQuery(""); }} style={styles.focusChip}>
                  <Text style={styles.focusT} numberOfLines={1}>{focus.label}</Text>
                  <X size={14} color={C.ink} />
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.listC} onScroll={onScroll} scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={pulling} onRefresh={onPull} tintColor={C.ink} />}>
          <EnableAlertsCard />
          {celebrate ? <ReunitedCelebration name={celebrate.name} onDone={endCelebration} /> : null}
          <MyReportCarousel reports={activeLost} matches={matches}
            onShare={(r) => Share.share({ message: reportShareText({ ...r }) }).catch(() => {})}
            onOpen={(r) => viewSighting(r.id)}
            onViewSighting={(m) => viewSighting(m.sighted_report_id)}
            onDismiss={(m) => { dismiss(m.id); snackbar.show({ message: "Match dismissed", actionLabel: "Undo", onAction: () => restore(m.id) }); }}
            onViewAll={(r) => setMatchesFor({ id: r.id, name: r.name ?? "your pet" })} />
          {error === "supabase-not-configured" ? (
            <SetupNotice />
          ) : error ? (
            <EmptyState title="We couldn't load reports" body="Check your connection and try again." actionLabel="Try again" onAction={refresh} />
          ) : loading ? (
            <View style={{ gap: 10 }} accessibilityLabel="Loading reports" accessibilityRole="progressbar">
              {[0, 1, 2, 3].map((i) => <ReportCardSkeleton key={i} />)}
            </View>
          ) : feedReports.length === 0 ? (
            <EmptyState {...emptyRadiusProps} />
          ) : sorted.length === 0 ? (
            <EmptyState title="No reports match your filters" actionLabel="Reset filters" onAction={() => { resetAll(); setListQuery(""); }} />
          ) : (
            <>
              <SortControl value={prefs.sort} onChange={setSort} count={sorted.length} radiusMi={prefs.viewRadiusMi} />
              {sorted.slice(0, resourceAt).map((r) => <ReportCard key={r.id} report={r} mine={mineIds.includes(r.id)} matchFor={matchNames[r.id]} onPress={() => setPinReport(r)} />)}
              {featured ? <CommunityResourceCard resource={featured} onPress={() => router.navigate({ pathname: "/(tabs)/support", params: { resourceId: featured.id } })} /> : null}
              {sorted.slice(resourceAt).map((r) => <ReportCard key={r.id} report={r} mine={mineIds.includes(r.id)} matchFor={matchNames[r.id]} onPress={() => setPinReport(r)} />)}
              <EndOfFeed radiusMi={prefs.viewRadiusMi} onExpand={() => setFiltersOpen(true)} />
            </>
          )}
        </ScrollView>
      )}
      <NewReportsPill count={newVisible} top={view === "map" ? 68 : 12} onPress={showNew} />
      </View>

      <EditLocationSheet visible={zoneOpen} onClose={() => { setZoneOpen(false); recheckLoc(); }} />
      <FilterSheet visible={filtersOpen} prefs={prefs} onChange={setPrefs} onReset={resetFilters} onClose={() => setFiltersOpen(false)} />
      <PinDetailSheet report={pinReport} mine={!!pinReport && mineIds.includes(pinReport.id)} onMarkReunited={onMarkReunited} onClose={() => setPinReport(null)} />
      <MatchesSheet lostName={matchesFor?.name ?? ""} matches={matchesFor ? matches.filter((m) => m.lost_report_id === matchesFor.id) : null}
        onClose={() => setMatchesFor(null)} onView={(m) => { setMatchesFor(null); setTimeout(() => viewSighting(m.sighted_report_id), 400); }} onDismiss={dismiss} onRestore={restore} />
      <ResourceModal resource={sheetResource} mode={sheetMode} onMode={setSheetMode} onClose={() => setSheetResource(null)} />
      <NotificationsSheet visible={notifOpen} items={items} onClose={() => setNotifOpen(false)} onPick={(n) => pickNotif(n.reportId)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  controls: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  rightCluster: { flexDirection: "row", alignItems: "center", gap: 8 },
  chipRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  recenter: { position: "absolute", right: 16, bottom: 16 + 73 + 12, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  // Deja libre la columna derecha del FAB (73 px + márgenes).
  preview: { position: "absolute", left: 12, right: 16 + 73 + 8, bottom: 16, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  focusChip: { position: "absolute", top: 12, right: 12, maxWidth: "55%", minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  focusT: { flexShrink: 1, fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
  finding: { position: "absolute", top: 68, left: 12, minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: C.white, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  findingT: { fontFamily: font.bodySemi, fontSize: 13, color: C.ink },
  mapEmpty: { position: "absolute", left: 12, right: 16 + 73 + 8, bottom: 16 },
  noMatch: { alignItems: "center", gap: 12, padding: 24, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: C.border2, backgroundColor: C.white },
  noMatchT: { fontFamily: font.head, fontSize: 16, color: C.ink },
  // Padding inferior = FAB + su margen: la última tarjeta se ve completa al llegar al final del scroll.
  listC: { padding: 16, paddingBottom: FAB_CLEARANCE, gap: 10 },
  mapWrap: { flex: 1 },
  pad: { padding: 16 },
  errBox: { gap: 8 },
  errT: { fontFamily: font.body, fontSize: 14, color: C.sosDark },
  retry: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.ink },
  retryT: { fontFamily: font.bodyBold, fontSize: 13, color: C.white },
});
