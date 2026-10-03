import { useEffect, useRef, useState } from "react";
import { Animated, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import type { MyReport } from "../hooks/useMyReports";
import type { MyMatch } from "../lib/database.types";
import { Theme } from "../theme/tokens";
import { MyReportStatusCard } from "./MyReportStatusCard";

type Handlers = {
  onOpen: (r: MyReport) => void; onViewSighting: (m: MyMatch) => void; onDismiss: (m: MyMatch) => void; onViewAll: (r: MyReport) => void; onShare: (r: MyReport) => void;
};

const GAP = 10;

// Uno o varios reportes Lost activos (ya ordenados por relevancia desde Home): uno = tarjeta a todo el ancho; varios = carrusel
// horizontal con la siguiente tarjeta asomando e indicador de página (puntos). Sin flechas de navegación.
// Altura: cada tarjeta mide lo que mide su contenido; el contenedor se ajusta con una transición corta a la tarjeta VISIBLE,
// así una tarjeta sin coincidencia no arrastra el espacio vacío de la más alta.
export function MyReportCarousel({ reports, matches, ...h }: { reports: MyReport[]; matches: MyMatch[] } & Handlers) {
  const { width } = useWindowDimensions();
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [page, setPage] = useState(0);
  const [seeded, setSeeded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const multi = reports.length > 1;
  const cur = heights[reports[Math.min(page, reports.length - 1)]?.id];

  useEffect(() => {
    if (!multi || !cur) return;
    if (!seeded) { anim.setValue(cur); setSeeded(true); }   // la primera medida se aplica sin animar
    else Animated.timing(anim, { toValue: cur, duration: 220, useNativeDriver: false }).start();
  }, [cur, multi, seeded, anim]);

  if (reports.length === 0) return null;
  const card = (r: MyReport, w?: number) => (
    <MyReportStatusCard report={r} width={w} matches={matches.filter((m) => m.lost_report_id === r.id)}
      onOpen={() => h.onOpen(r)} onViewSighting={h.onViewSighting} onDismiss={h.onDismiss} onViewAll={() => h.onViewAll(r)} onShare={() => h.onShare(r)} />
  );
  if (!multi) return <View>{card(reports[0])}</View>;

  const w = width - 32 - 32; // 16 de margen a cada lado del feed + 32 de la tarjeta siguiente asomando
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.max(0, Math.min(reports.length - 1, Math.round(e.nativeEvent.contentOffset.x / (w + GAP))));
    if (p !== page) setPage(p);
  };
  return (
    <View>
      <Animated.View style={[{ marginHorizontal: -16 }, seeded ? { height: anim } : null]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={w + GAP} decelerationRate="fast" onScroll={onScroll} scrollEventThrottle={16}
          contentContainerStyle={{ gap: GAP, paddingHorizontal: 16, alignItems: "flex-start" }}>
          {reports.map((r) => (
            <View key={r.id} style={{ width: w }} onLayout={(e) => { const hh = Math.round(e.nativeEvent.layout.height); setHeights((p) => (p[r.id] === hh ? p : { ...p, [r.id]: hh })); }}>
              {card(r, w)}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
      <View style={styles.dots} accessibilityRole="adjustable" accessibilityLabel={`Report ${Math.min(page, reports.length - 1) + 1} of ${reports.length}`}>
        {reports.map((r, i) => <View key={r.id} style={[styles.dot, i === page && styles.dotOn]} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Theme.border.strong },
  dotOn: { width: 18, backgroundColor: Theme.brand.primary }, // forma distinta además del color: el punto activo es alargado
});
