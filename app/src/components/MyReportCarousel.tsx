import { ScrollView, View, useWindowDimensions } from "react-native";
import type { MyReport } from "../hooks/useMyReports";
import type { MyMatch } from "../lib/database.types";
import { MyReportStatusCard } from "./MyReportStatusCard";

type Handlers = {
  onOpen: (r: MyReport) => void; onViewSighting: (m: MyMatch) => void; onDismiss: (m: MyMatch) => void; onViewAll: (r: MyReport) => void; onShare: (r: MyReport) => void;
};

// Uno o varios reportes Lost activos: uno = tarjeta a todo el ancho; varios = carrusel horizontal compacto con la siguiente asomando.
export function MyReportCarousel({ reports, matches, ...h }: { reports: MyReport[]; matches: MyMatch[] } & Handlers) {
  const { width } = useWindowDimensions();
  if (reports.length === 0) return null;
  const card = (r: MyReport, w?: number) => (
    <MyReportStatusCard key={r.id} report={r} width={w} matches={matches.filter((m) => m.lost_report_id === r.id)}
      onOpen={() => h.onOpen(r)} onViewSighting={h.onViewSighting} onDismiss={h.onDismiss} onViewAll={() => h.onViewAll(r)} onShare={() => h.onShare(r)} />
  );
  if (reports.length === 1) return <View>{card(reports[0])}</View>;
  const w = width - 32 - 32; // 16 de margen a cada lado del feed + 32 de la tarjeta siguiente asomando
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={w + 10} decelerationRate="fast" contentContainerStyle={{ gap: 10, paddingRight: 16 }}
      style={{ marginHorizontal: -16 }} contentInset={{ left: 16 }} contentOffset={{ x: -16, y: 0 }}>
      {reports.map((r) => card(r, w))}
    </ScrollView>
  );
}
