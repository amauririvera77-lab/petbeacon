import { HeartHandshake, Search, X } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { OfflineBanner } from "../../components/OfflineBanner";
import { EventResourceCard, ResourceCard } from "../../components/ResourceCard";
import { ResourceModal, ResourceSheetMode } from "../../components/ResourceModal";
import { SetupNotice } from "../../components/SetupNotice";
import { useHome } from "../../hooks/useHome";
import { useNow } from "../../hooks/useNow";
import { useResourcesState } from "../../hooks/useResources";
import type { ResourceNearby } from "../../lib/database.types";
import { mapEventResources } from "../../lib/homeFilters";
import { CATEGORIES } from "../../lib/resources";
import { useSession } from "../../state/session";
import { C, font, radius } from "../../theme/tokens";

// Radio amplio: los recursos comunitarios no dependen del radio de alerta del usuario.
const SUPPORT_RADIUS_MI = 30;

export default function Support() {
  const insets = useSafeAreaInsets();
  const { city } = useSession();
  const center = useHome();
  const now = useNow();
  const { resources, loading, error, refresh } = useResourcesState(SUPPORT_RADIUS_MI, center.lat, center.lng);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["key"]>("all");
  const [contact, setContact] = useState<ResourceNearby | null>(null);
  const [mode, setMode] = useState<ResourceSheetMode>("contact");

  // Desde la tarjeta "Community resource" del feed: abre directamente el detalle de ese recurso.
  const { resourceId } = useLocalSearchParams<{ resourceId?: string }>();
  useEffect(() => {
    if (!resourceId || resources.length === 0) return;
    const r = resources.find((x) => x.id === resourceId);
    if (r) { setMode("detail"); setContact(r); }
    router.setParams({ resourceId: undefined });
  }, [resourceId, resources]);

  const q = query.trim().toLowerCase();
  // Eventos vigentes (hoy o futuros) SIEMPRE arriba, del más próximo al más lejano en fecha; el resto conserva el orden por distancia.
  // Un evento ya pasado deja de destacarse y vuelve a su lugar normal.
  const { filtered, eventIds } = useMemo(() => {
    const list = resources.filter((r) => (category === "all" || r.category === category) && (!q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)));
    const events = mapEventResources(list, now); // en curso primero, luego por fecha; un evento terminado deja de destacarse
    const ids = new Set(events.map((r) => r.id));
    return { filtered: [...events, ...list.filter((r) => !ids.has(r.id))], eventIds: ids };
  }, [resources, category, q, now]);
  const reset = () => { setQuery(""); setCategory("all"); };

  return (
    <View style={styles.root}>
      <View style={[styles.head, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.h} accessibilityRole="header">Support and care</Text>
        <Text style={styles.sub}>Local resources near {city || "you"}</Text>
        <View style={styles.search}>
          <Search size={18} color={C.slate500} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search by name or need" placeholderTextColor={C.slate500}
            accessibilityLabel="Search resources" style={styles.input} returnKeyType="search" />
          {query.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery("")} style={styles.clear}><X size={14} color={C.slate700} /></Pressable>
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
                <Text style={[styles.chipT, on && { color: C.white }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {error === "supabase-not-configured" ? <SetupNotice /> : error ? (
          <View style={{ gap: 8 }}>
            <Text style={styles.err}>Couldn't load resources: {error}</Text>
            <Pressable accessibilityRole="button" onPress={refresh} style={styles.retry}><Text style={styles.retryT}>Retry</Text></Pressable>
          </View>
        ) : loading ? <ActivityIndicator style={{ marginTop: 24 }} color={C.teal} /> : filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><HeartHandshake size={26} color="#94A3B8" /></View>
            <Text style={styles.emptyT}>{resources.length === 0 ? "No resources near you yet" : "No matching resources"}</Text>
            <Text style={styles.emptyS}>{resources.length === 0 ? "We're still adding local resources in your area." : "Try a different category or search term."}</Text>
            {resources.length > 0 ? <Pressable accessibilityRole="button" onPress={reset} style={styles.emptyBtn}><Text style={styles.emptyBtnT}>Clear filters</Text></Pressable> : null}
          </View>
        ) : filtered.map((r) => {
          const onContact = () => { setMode("contact"); setContact(r); };
          return eventIds.has(r.id) ? <EventResourceCard key={r.id} resource={r} onContact={onContact} /> : <ResourceCard key={r.id} resource={r} onContact={onContact} />;
        })}
      </ScrollView>

      <ResourceModal resource={contact} mode={mode} onMode={setMode} onClose={() => setContact(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.surface },
  head: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  h: { fontFamily: font.displayMedium, fontSize: 24, letterSpacing: -0.24, color: C.ink, marginBottom: 4 },
  sub: { fontFamily: font.bodyRegular, fontSize: 14, color: C.slate700, marginBottom: 16 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 52, borderRadius: radius.md, backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  input: { flex: 1, fontFamily: font.body, fontSize: 16, color: C.ink },
  clear: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.border, alignItems: "center", justifyContent: "center" },
  chipsBar: { backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  chips: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, justifyContent: "center" },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  chipT: { fontFamily: font.bodyBold, fontSize: 13, color: C.slate700 },
  list: { padding: 16, paddingBottom: 200, gap: 12 },
  err: { fontFamily: font.body, fontSize: 14, color: C.sosDark },
  retry: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: C.ink },
  retryT: { fontFamily: font.bodyBold, fontSize: 13, color: C.white },
  empty: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24, borderRadius: radius.lg, backgroundColor: C.white, borderWidth: 1, borderStyle: "dashed", borderColor: C.border2 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyT: { fontFamily: font.head, fontSize: 17, color: C.ink, marginBottom: 4 },
  emptyS: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19, color: C.slate700, textAlign: "center", marginBottom: 20 },
  emptyBtn: { height: 44, paddingHorizontal: 20, borderRadius: radius.md, backgroundColor: C.ink, justifyContent: "center" },
  emptyBtnT: { fontFamily: font.bodyBold, fontSize: 14, color: C.white },
});
