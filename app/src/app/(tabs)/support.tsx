import { HeartHandshake, Search, X } from "lucide-react-native";
import { Fragment, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "../../components/OfflineBanner";
import { ScreenTitle } from "../../components/ScreenTitle";
import { EventResourceCard, ResourceCard } from "../../components/ResourceCard";
import { ResourceModal, ResourceSheetMode } from "../../components/ResourceModal";
import { SetupNotice } from "../../components/SetupNotice";
import { useFabScroll } from "../../hooks/useFabScroll";
import { useHome } from "../../hooks/useHome";
import { useNow } from "../../hooks/useNow";
import { useResourcesState } from "../../hooks/useResources";
import type { ResourceNearby } from "../../lib/database.types";
import { mapEventResources } from "../../lib/homeFilters";
import { CATEGORIES, directionsUrl, isSample, supportOrder, webUrl } from "../../lib/resources";
import { useSession } from "../../state/session";
import { FAB_CLEARANCE, Theme, radius } from "../../theme/tokens";
import { typography } from "../../theme/typography";

// Radio amplio: los recursos comunitarios no dependen del radio de alerta del usuario.
const SUPPORT_RADIUS_MI = 30;
// Fase de congelación 6: el banner de "datos de muestra" se ve por defecto — este flag SOLO se pone en true para las
// capturas del case study (nunca en un build real mientras los recursos sigan siendo de muestra).
const HIDE_SAMPLE_NOTICE = process.env.EXPO_PUBLIC_HIDE_SAMPLE_NOTICE === "true";

export default function Support() {
  const insets = useSafeAreaInsets();
  const { city } = useSession();
  const center = useHome();
  const now = useNow();
  const { onScroll } = useFabScroll();
  const { resources, loading, error, refresh } = useResourcesState(SUPPORT_RADIUS_MI, center.lat, center.lng);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [contact, setContact] = useState<ResourceNearby | null>(null);
  const [mode, setMode] = useState<ResourceSheetMode>("contact");

  const q = query.trim().toLowerCase();
  // Eventos vigentes (hoy o futuros) SIEMPRE arriba, del más próximo al más lejano en fecha; el resto conserva el orden por distancia.
  // Un evento ya pasado deja de destacarse y vuelve a su lugar normal.
  const { filtered, eventIds } = useMemo(() => {
    const list = resources.filter((r) => (category === "all" || r.category === category) && (!q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)));
    const events = mapEventResources(list, now); // en curso primero, luego por fecha; un evento terminado deja de destacarse
    const ids = new Set(events.map((r) => r.id));
    // Eventos vigentes primero; el resto por distancia; los recursos de entrega o ingreso a refugio, SIEMPRE al final (5.5).
    return { filtered: [...events, ...supportOrder(list.filter((r) => !ids.has(r.id)))], eventIds: ids };
  }, [resources, category, q, now]);
  const reset = () => { setQuery(""); setCategory("all"); };
  // Un único aviso de datos de muestra al principio de la lista (Fase 6) — oculto solo con EXPO_PUBLIC_HIDE_SAMPLE_NOTICE=true.
  const hasSample = !HIDE_SAMPLE_NOTICE && filtered.some(isSample);
  // "If you're considering rehoming": solo en la vista "All", justo antes del primer recurso de "Rehoming & shelters" (nunca antes de un evento).
  const shelterStart = category === "all" ? filtered.findIndex((r) => r.category === "shelter" && !eventIds.has(r.id)) : -1;
  // Acción principal de cada tarjeta (5.3). Con datos de muestra el botón se ve y se toca igual que cualquier otro — abre
  // la explicación breve del modal (Fase 6) en vez de llamar o abrir un mapa falso.
  const act = (r: ResourceNearby, kind: "directions" | "learn" | "contact") => {
    if (isSample(r)) { setMode("sample"); setContact(r); return; }
    if (kind === "contact") { setMode("contact"); setContact(r); return; }
    const url = kind === "directions" ? directionsUrl(r) : webUrl(r.website_url);
    if (url) Linking.openURL(url).catch(() => Alert.alert("Couldn't open that", "Your device couldn't handle this action."));
  };

  return (
    <View style={styles.root}>
      <View style={[styles.head, { paddingTop: insets.top + 24 }]}>
        <ScreenTitle title="Support" subtitle={`Local resources near ${city || "you"}`} variant="display" />
        <View style={{ height: 16 }} />
        <View style={styles.search}>
          <Search size={18} color={Theme.text.muted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search by name or need" placeholderTextColor={Theme.text.muted}
            accessibilityLabel="Search resources" style={styles.input} returnKeyType="search" />
          {query.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery("")} style={styles.clear}><X size={14} color={Theme.text.secondary} /></Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.chipsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map((c) => {
            const on = c.key === category;
            return (
              <Pressable key={c.key} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setCategory(c.key)}
                style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipT, on && { color: Theme.text.onAccent }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" onScroll={onScroll} scrollEventThrottle={16}>
        {error === "supabase-not-configured" ? <SetupNotice /> : error ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.err}>Couldn't load resources: {error}</Text>
            <Pressable accessibilityRole="button" onPress={refresh} style={styles.retry}><Text style={styles.retryT}>Retry</Text></Pressable>
          </View>
        ) : loading ? <ActivityIndicator style={{ marginTop: 24 }} color={Theme.brand.primary} /> : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><HeartHandshake size={26} color={Theme.text.muted} /></View>
            <Text style={styles.emptyT}>{resources.length === 0 ? "No resources near you yet" : "No matching resources"}</Text>
            <Text style={styles.emptyS}>{resources.length === 0 ? "We're still adding local resources in your area." : "Try a different category or search term."}</Text>
            {resources.length > 0 ? <Pressable accessibilityRole="button" onPress={reset} style={styles.emptyBtn}><Text style={styles.emptyBtnT}>Clear filters</Text></Pressable> : null}
          </View>
        ) : (
          <>
            {hasSample ? (
              <View style={styles.sampleBanner}><Text style={styles.sampleBannerT}>These resources are sample data for testing.</Text></View>
            ) : null}
            {filtered.map((r, i) => {
              const onAction = (kind: "directions" | "learn" | "contact") => act(r, kind);
              const card = eventIds.has(r.id) ? <EventResourceCard key={r.id} resource={r} onAction={onAction} /> : <ResourceCard key={r.id} resource={r} onAction={onAction} />;
              if (i !== shelterStart) return card;
              // Sin View envolvente: encabezado y tarjeta cuelgan DIRECTO de la lista (mismo gap de 12 que antes), igual que el
              // resto de tarjetas. Con el wrapper, en iOS la descripción de la tarjeta se medía a 2 líneas pero se dibujaba
              // cortada en 1 ("b…") con un hueco debajo.
              return (
                <Fragment key={`shelter-group-${r.id}`}>
                  <View style={styles.rehomeHead}>
                    <Text style={styles.rehomeT}>If you're considering rehoming</Text>
                    <Text style={styles.rehomeS}>These organizations can help you find a safe next home.</Text>
                  </View>
                  {card}
                </Fragment>
              );
            })}
          </>
        )}
      </ScrollView>

      <ResourceModal resource={contact} mode={mode} onMode={setMode} onClose={() => setContact(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.surface.page },
  head: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: Theme.surface.card, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 52, borderRadius: radius.md, backgroundColor: Theme.surface.page, borderWidth: 1.5, borderColor: Theme.border.default },
  input: { flex: 1, ...typography.bodyLg16, color: Theme.text.primary },
  clear: { width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.border.default, alignItems: "center", justifyContent: "center" },
  chipsBar: { backgroundColor: Theme.surface.card, borderBottomWidth: 1, borderBottomColor: Theme.border.default },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5, borderColor: Theme.border.default, backgroundColor: Theme.surface.card, justifyContent: "center" },
  chipOn: { backgroundColor: Theme.brand.primary, borderColor: Theme.brand.primary },
  chipT: { ...typography.button14, color: Theme.text.secondary },
  list: { padding: 16, paddingBottom: FAB_CLEARANCE, gap: 12 },
  err: { ...typography.body14, color: Theme.danger.text },
  retry: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: Theme.brand.primary },
  retryT: { ...typography.button14, color: Theme.text.onAccent },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24, borderRadius: radius.lg, backgroundColor: Theme.surface.card, borderWidth: 1, borderStyle: "dashed", borderColor: Theme.border.strong },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.surface.page, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyT: { ...typography.heading18, color: Theme.text.primary, marginBottom: 4 },
  emptyS: { ...typography.bodySm13, color: Theme.text.secondary, textAlign: "center", marginBottom: 20 },
  emptyBtn: { height: 44, paddingHorizontal: 20, borderRadius: radius.md, backgroundColor: Theme.brand.primary, justifyContent: "center" },
  emptyBtnT: { ...typography.button14, color: Theme.text.onAccent },
  // Un único aviso de datos de muestra al principio de la lista, en vez de una etiqueta por tarjeta.
  sampleBanner: { padding: 12, borderRadius: radius.md, backgroundColor: Theme.surface.page, borderWidth: 1, borderColor: Theme.border.strong },
  sampleBannerT: { ...typography.label13, color: Theme.text.secondary, textAlign: "center" },
  // "Support Before Surrender" (5.5): encabezado antes del primer recurso de "Rehoming & shelters", solo en la vista "All".
  rehomeHead: { gap: 2 },
  rehomeT: { ...typography.heading16, color: Theme.text.primary },
  rehomeS: { ...typography.bodySm13, color: Theme.text.secondary },
});
