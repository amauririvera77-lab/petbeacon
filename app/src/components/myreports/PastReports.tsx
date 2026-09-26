import { ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MyReport } from "../../hooks/useMyReports";
import { pastDate, pastResult } from "../../lib/myReports";
import { reportTitle } from "../../lib/reportText";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";
import { FocusImage } from "../FocusImage";
import { SpeciesPlaceholder } from "../SpeciesPlaceholder";

const fmt = (ms: number) => new Date(ms).toLocaleDateString([], { month: "short", day: "numeric" });

// Historial plegado (My Reports 4.8): reunidos, resueltos, cerrados y avistamientos vencidos, cada uno con su resultado y fecha.
export function PastReports({ reports }: { reports: MyReport[] }) {
  const [open, setOpen] = useState(false);
  if (reports.length === 0) return null;
  return (
    <View style={{ marginTop: 20 }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((o) => !o)} style={styles.head}>
        <Text style={styles.h}>Past reports ({reports.length})</Text>
        <View style={open && { transform: [{ rotate: "180deg" }] }}><ChevronDown size={20} color={C.slate500} /></View>
      </Pressable>
      {open ? (
        <View style={{ gap: 8, marginTop: 4 }}>
          {reports.map((r) => (
            <View key={r.id} style={styles.row}>
              {r.photo_url ? <FocusImage uri={r.photo_url} focusX={r.photo_focus_x} focusY={r.photo_focus_y} zoom={(r.photo_zoom ?? 100) / 100} style={styles.thumb} /> : <SpeciesPlaceholder species={r.species} size={48} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.title} numberOfLines={1}>{reportTitle(r)}</Text>
                <Text style={styles.result}>{pastResult(r)} · {fmt(pastDate(r))}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  head: { minHeight: MIN_HIT, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { fontFamily: font.head, fontSize: 18, color: C.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border, backgroundColor: C.white },
  thumb: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: C.surface },
  title: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  result: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate700, marginTop: 2 },
});
