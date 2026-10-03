import { useFocusEffect } from "expo-router";
import { LocateFixed, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, type NativeScrollEvent, type NativeSyntheticEvent, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, View } from "react-native";
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
import { useHomePrefs, type ViewRadius } from "../../state/homePrefs";
import { useSession } from "../../state/session";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTabBarClearance } from "../../hooks/useTabBarClearance";
import { Theme, radius } from "../../theme/tokens";
import { elevation } from "../../theme/elevation";
import { typography } from "../../theme/typography";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

// List (default) y Map con igual jerarquía (CLAUDE.md §7); ambos leen los mismos datos y el mismo radio.
// Alto reservado de la búsqueda de la lista y recorrido mínimo en una misma dirección antes de mostrarla u ocultarla.
const SEARCH_H = 54;
const SCROLL_HYSTERESIS = 20;

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
  const TAB_BAR_CLEARANCE = useTabBarClearance();
  const { prefs, setPrefs, setSort, resetFilters, resetAll, listQuery, setListQuery, mapQuery, setMapQuery, view, setView } = useHomePrefs();
  const uid = useAuthUser();
  const center = useHome();
  const { pos: me, status: posStatus } = useMyPosition(view === "map");
  const { status: locPerm, recheck: recheckLoc } = useLocationPermission();
  const [locDismissed, setLocDismissed] = useState(false);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [scrolled, setScrolled] = useState(false); // header con elevation/1 solo cuando el feed pasa por debajo (Fase 3)
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

  // Dirección de scroll de la lista (solo Home, independiente de la tab bar): tras recorrer al menos SCROLL_HYSTERESIS px
  // seguidos hacia abajo se marca `scrollingDown` (oculta la búsqueda); hacia arriba, se limpia. En las zonas de rebote
  // de iOS (arriba: offset <= 0; abajo: se llegó al final) el offset se invierte solo, así que NO cuentan como cambio de
  // dirección — sin esto, soltar al final de la lista hacía reaparecer la búsqueda. Al entrar a la pantalla o volver a la
  // lista empieza en "arriba".
  const [scrollingDown, setScrollingDown] = useState(false);
  const lastY = useRef(0);
  const dirTravel = useRef(0); // recorrido acumulado con signo en la dirección actual
  const resetScrollDir = useCallback(() => { lastY.current = 0; dirTravel.current = 0; setScrollingDown(false); }, []);
  const onListScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const y = contentOffset.y, dy = y - lastY.current;
    lastY.current = y;
    const bouncing = y <= 0 || y + layoutMeasurement.height >= contentSize.height - 1;
    if (bouncing || dy === 0) { dirTravel.current = 0; return; }
    if (Math.sign(dy) !== Math.sign(dirTravel.current)) dirTravel.current = 0;
    dirTravel.current += dy;
    if (dirTravel.current >= SCROLL_HYSTERESIS) setScrollingDown(true);
    else if (dirTravel.current <= -SCROLL_HYSTERESIS) setScrollingDown(false);
  }, []);
  useFocusEffect(resetScrollDir);
  useEffect(() => { if (view !== "map") { setPreviewId(null); resetScrollDir(); } else setScrolled(false); }, [view, resetScrollDir]);

  // D.6: al bajar la lista la búsqueda se contrae y quedan fijos chips y List/Map; al subir reaparece.
  // Con texto en la búsqueda NO se contrae, y en Map siempre está visible.
  const hideSearch = view === "list" && scrollingDown && listQuery.trim() === "";
  // La búsqueda se muestra/oculta SOLO con transformaciones (translateY + opacidad): nada cambia de tamaño en el layout, así que
  // la lista nunca se recoloca. El bloque de controles, los avisos y la lista suben/bajan juntos SEARCH_H; el marco de la lista
  // ya viene SEARCH_H más alto por debajo (queda detrás de la tab bar). Con movimiento reducido el cambio es instantáneo.
  const reducedMotion = useReducedMotion();
  const searchAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reducedMotion) { searchAnim.setValue(hideSearch ? 0 : 1); return; }
    Animated.timing(searchAnim, { toValue: hideSearch ? 0 : 1, duration: 180, useNativeDriver: true }).start();
  }, [hideSearch, reducedMotion, searchAnim]);
  const slide = searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-SEARCH_H, 0] });

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

  // Tarjeta inferior del mapa (vista previa de un pin o aviso de estado vacío): tapa la atribución y el logo de Mapbox, que son
  // obligatorios. Se mide su alto real (onLayout) y se suma al inset que recibe el WebView; sin tarjeta, vuelve al valor normal.
  const mapEmptyEl = error ? (
    <EmptyState title="We couldn't load reports" body="Check your connection and try again." actionLabel="Try again" onAction={refresh} />
  ) : noReportsInRadius && !preview ? (
    <EmptyState {...emptyRadiusProps} />
  ) : !loading && reports.length > 0 && mapReports.length === 0 ? (
    <EmptyState title="No reports match your filters" actionLabel="Reset filters" onAction={resetAll} />
  ) : null;
  const [cardH, setCardH] = useState(0);
  const mapInset = TAB_BAR_CLEARANCE + (preview || mapEmptyEl ? cardH + 8 : 0);

  return (
    <View style={styles.root}>
      <View>
        {/* Barra del logo: su propio fondo y por ENCIMA (zIndex) del bloque de controles, que al ocultar la búsqueda sube por detrás de ella. */}
        <View style={[styles.logoBar, { paddingTop: insets.top }]}>
          <HomeHeader unread={unread} onBell={openNotifs} />
        </View>
        {/* `controls` solo reserva el hueco (transparente). El fondo blanco, el borde inferior y la sombra viven en `controlsInner`,
            que es lo que se traslada: así el encabezado termina justo debajo de los chips y no queda ninguna franja blanca. */}
        <View style={styles.controls}>
          <Animated.View pointerEvents="box-none" style={[styles.controlsInner, view === "list" && scrolled && elevation[1], { transform: [{ translateY: slide }] }]}>
          <Animated.View style={{ height: SEARCH_H, opacity: searchAnim, overflow: "hidden" }} pointerEvents={hideSearch ? "none" : "auto"}>
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
          </Animated.View>
        </View>
      </View>
      <Animated.View pointerEvents="box-none" style={{ transform: [{ translateY: slide }] }}>
        <OfflineBanner lastUpdated={lastUpdated ?? null} failed={failed && !error} onRetry={refresh} />
        {locPerm === "denied" && !locDismissed ? <LocationOffStrip onSetZone={() => setZoneOpen(true)} onDismiss={() => setLocDismissed(true)} /> : null}
      </Animated.View>

      {/* El área de contenido es lo que se traslada (en List, con el marco SEARCH_H más alto por debajo): así los toques de la lista
          siempre caen dentro de los límites de su contenedor, también en Android. En Map no se mueve ni se alarga. */}
      <Animated.View style={{ flex: 1, marginBottom: view === "list" ? -SEARCH_H : 0, transform: [{ translateY: slide }] }}>
      {view === "map" ? (
        <View style={styles.mapWrap}>
          {!MAPBOX_TOKEN ? (
            <View style={styles.pad}><SetupNotice what="Mapbox" vars="EXPO_PUBLIC_MAPBOX_TOKEN" /></View>
          ) : error === "supabase-not-configured" ? (
            <View style={styles.pad}><SetupNotice /></View>
          ) : (
            <>
              <MapboxWebView ref={mapRef} bottomInset={mapInset} alertRadiusMi={alertRadiusMi} selectedId={preview?.id ?? null} token={MAPBOX_TOKEN} reports={mapReports} resources={mapResources} center={center} radiusMi={prefs.viewRadiusMi} me={me} mineIds={mineIds} matchNames={matchNames} focus={focus} onSelect={(sel) => {
                if (!sel) { setPreviewId(null); return; }
                if (sel.kind === "resource") { setPreviewId(null); const r = mapResources.find((x) => x.id === sel.id); if (r) openResource(r); }
                else setPreviewId(sel.id);
              }} />
              {posStatus === "finding" ? (
                <View style={styles.finding} accessibilityLiveRegion="polite">
                  <ActivityIndicator size="small" color={Theme.text.primary} />
                  <Text style={styles.findingT}>Finding your location…</Text>
                </View>
              ) : null}
              {mapEmptyEl ? <View style={[styles.mapEmpty, { bottom: TAB_BAR_CLEARANCE }]} onLayout={(e) => setCardH(e.nativeEvent.layout.height)}>{mapEmptyEl}</View> : null}
              <MapRadiusChip value={prefs.viewRadiusMi} onChange={(mi) => setPrefs({ viewRadiusMi: mi as ViewRadius })} />
              <Pressable accessibilityRole="button" accessibilityLabel="Center map on my location" onPress={() => mapRef.current?.recenter()} style={[styles.recenter, { bottom: TAB_BAR_CLEARANCE }]}>
                <LocateFixed size={22} color={Theme.text.primary} />
              </Pressable>
              {preview ? (
                <View style={[styles.preview, { bottom: TAB_BAR_CLEARANCE }]} onLayout={(e) => setCardH(e.nativeEvent.layout.height)}>
                  <ReportCard report={preview} mine={mineIds.includes(preview.id)} matchFor={matchNames[preview.id]} onPress={() => setPinReport(preview)} />
                </View>
              ) : null}
              {focus ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Clear searched area" onPress={() => { setFocus(null); setMapQuery(""); }} style={styles.focusChip}>
                  <Text style={styles.focusT} numberOfLines={1}>{focus.label}</Text>
                  <X size={14} color={Theme.text.primary} />
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.listC, { paddingBottom: TAB_BAR_CLEARANCE + SEARCH_H }]} onScroll={(e) => { onListScroll(e); setScrolled(e.nativeEvent.contentOffset.y > 0); }} scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={pulling} onRefresh={onPull} tintColor={Theme.brand.primary} />}>
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
              {featured ? <CommunityResourceCard resource={featured} onPress={() => openResource(featured)} /> : null}
              {sorted.slice(resourceAt).map((r) => <ReportCard key={r.id} report={r} mine={mineIds.includes(r.id)} matchFor={matchNames[r.id]} onPress={() => setPinReport(r)} />)}
              <EndOfFeed radiusMi={prefs.viewRadiusMi} onExpand={() => setFiltersOpen(true)} />
            </>
          )}
        </ScrollView>
      )}
      <NewReportsPill count={newVisible} top={view === "map" ? 68 : 12} onPress={showNew} />
      </Animated.View>

      <EditLocationSheet visible={zoneOpen} onClose={() => { setZoneOpen(false); recheckLoc(); }} />
      <FilterSheet visible={filtersOpen} prefs={prefs} onChange={setPrefs} onReset={resetFilters} onClose={() => setFiltersOpen(false)} />
      <PinDetailSheet report={pinReport} mine={!!pinReport && mineIds.includes(pinReport.id)} onMarkReunited={onMarkReunited} onClose={() => setPinReport(null)}
        matchCount={pinReport ? matches.filter((m) => m.lost_report_id === pinReport.id && !m.dismissed).length : undefined}
        onReviewMatches={(r) => { setPinReport(null); setTimeout(() => setMatchesFor({ id: r.id, name: r.name ?? "your pet" }), 400); }} />
      <MatchesSheet lostName={matchesFor?.name ?? ""} matches={matchesFor ? matches.filter((m) => m.lost_report_id === matchesFor.id) : null}
        onClose={() => setMatchesFor(null)} onView={(m) => { setMatchesFor(null); setTimeout(() => viewSighting(m.sighted_report_id), 400); }} onDismiss={dismiss} onRestore={restore} />
      <ResourceModal resource={sheetResource} mode={sheetMode} onMode={setSheetMode} onClose={() => setSheetResource(null)} />
      <NotificationsSheet visible={notifOpen} items={items} onClose={() => setNotifOpen(false)} onPick={(n) => pickNotif(n.reportId)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.surface.page },
  logoBar: { zIndex: 1, backgroundColor: Theme.surface.card },
  // `controls` es el hueco estático y TRANSPARENTE (solo reserva alto); `controlsInner` lleva el fondo, el borde y se traslada.
  controls: {},
  controlsInner: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Theme.surface.card, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  rightCluster: { flexDirection: "row", alignItems: "center", gap: 8 },
  chipRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  // Controles flotantes del mapa: su `bottom` es TAB_BAR_CLEARANCE (por encima de la tab bar), se aplica en línea.
  recenter: { position: "absolute", right: 16, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: Theme.surface.card, ...elevation[1] },
  // Deja libre la columna derecha del FAB (73 px + márgenes).
  // right: deja sitio al botón de recentrar (48 + 16 de margen + 8 de separación), que comparte línea base con la tarjeta.
  preview: { position: "absolute", left: 12, right: 16 + 48 + 8, ...elevation[2] },
  focusChip: { position: "absolute", top: 12, right: 12, maxWidth: "55%", minHeight: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: Theme.surface.card, ...elevation[1] },
  focusT: { flexShrink: 1, ...typography.label13, color: Theme.text.primary },
  finding: { position: "absolute", top: 68, left: 12, minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: Theme.surface.card, ...elevation[1] },
  findingT: { ...typography.label13, color: Theme.text.primary },
  mapEmpty: { position: "absolute", left: 12, right: 16 + 48 + 8 },
  // El padding inferior (TAB_BAR_CLEARANCE) se aplica en línea: la última tarjeta se ve completa sobre la tab bar.
  listC: { padding: 16, gap: 10 },
  mapWrap: { flex: 1 },
  pad: { padding: 16 },
});
