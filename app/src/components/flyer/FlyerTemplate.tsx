import QRCode from "react-native-qrcode-svg";
import { StyleSheet, Text, View } from "react-native";
import type { FlyerReport } from "../../lib/flyer";
import { C, font } from "../../theme/tokens";
import { FocusImage } from "../FocusImage";
import { Logo } from "../Logo";

// Tamaño de diseño 3:4; se captura a 1080×1440 px. Alto contraste: debe leerse fotocopiado en blanco y negro,
// por eso el teléfono va grande y en texto (el QR es secundario).
export const FLYER_W = 340;
export const FLYER_H = 453;

function when(iso: string) {
  const d = new Date(iso), now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const day = d.toDateString() === now.toDateString() ? "Today" : d.toDateString() === y.toDateString() ? "Yesterday" : d.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${day}, ${time}`;
}

type Props = {
  report: FlyerReport;
  contact: string | null; // solo si quien genera el flyer es el dueño del Lost
  url: string | null; // página pública del reporte (QR)
  onPhotoReady: () => void;
};

export function FlyerTemplate({ report: r, contact, url, onPhotoReady }: Props) {
  const lost = r.status === "lost";
  const accent = lost ? C.sos : C.warn;
  const title = r.name?.trim() || `Unknown ${r.species}`;
  const seen = `${when(r.created_at)}${r.location_label ? ` · ${r.location_label}` : ""}`;

  return (
    <View style={styles.page} collapsable={false}>
      <View style={[styles.head, { backgroundColor: accent }]}>
        <Text style={[styles.headT, !lost && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit>
          {lost ? "MISSING" : "Have you seen this pet?"}
        </Text>
      </View>

      <View style={styles.photo}>
        {r.photo_url ? (
          <FocusImage uri={r.photo_url} focusX={r.photo_focus_x} focusY={r.photo_focus_y} style={StyleSheet.absoluteFill} onReady={onPhotoReady} onError={onPhotoReady} />
        ) : null}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{title}</Text>
        {r.breed ? <Text style={styles.breed} numberOfLines={1}>{r.breed}</Text> : null}
        <Text style={styles.label}>{lost ? "LAST SEEN" : "SPOTTED"}</Text>
        <Text style={styles.seen} numberOfLines={2}>{seen}</Text>
        {r.features_description ? <Text style={styles.features} numberOfLines={2}>{r.features_description}</Text> : null}
      </View>

      <View style={styles.contact}>
        <View style={{ flex: 1, gap: 4 }}>
          {lost && contact ? (
            <>
              <Text style={styles.label}>CALL OR TEXT</Text>
              <View style={styles.phoneBox}>
                <Text style={styles.phone} numberOfLines={1} adjustsFontSizeToFit>{contact}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.ask}>{lost ? "Have you seen this pet?" : "Recognize this pet?"}</Text>
              <Text style={styles.askS}>{url ? "Scan to view details or notify the owner." : "Open PetBeacon to view details or notify the owner."}</Text>
            </>
          )}
        </View>
        {url ? (
          <View style={styles.qr}>
            <QRCode value={url} size={lost && contact ? 72 : 84} color="#000" backgroundColor="#fff" quietZone={4} />
            <Text style={styles.qrT}>{lost && contact ? "Or scan for live details" : "Scan for live details"}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.foot}>
        <Text style={styles.footT}>Reported via PetBeacon</Text>
        <Logo width={64} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { width: FLYER_W, height: FLYER_H, backgroundColor: "#fff", overflow: "hidden" },
  head: { height: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  headT: { fontFamily: font.display, fontSize: 32, letterSpacing: 2, color: "#fff" },
  photo: { height: 140, backgroundColor: "#F1F5F9" },
  info: { flex: 1, paddingHorizontal: 14, paddingTop: 8, gap: 1 },
  name: { fontFamily: font.headBold, fontSize: 26, color: "#000" },
  breed: { fontFamily: font.body, fontSize: 13, color: "#1E293B", marginBottom: 4 },
  label: { fontFamily: font.bodyBold, fontSize: 9, letterSpacing: 1, color: "#475569" },
  seen: { fontFamily: font.bodyBold, fontSize: 12, color: "#000" },
  features: { fontFamily: font.bodyRegular, fontSize: 11, lineHeight: 15, color: "#1E293B", marginTop: 3 },
  contact: { height: 96, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderTopWidth: 2, borderTopColor: "#000" },
  phoneBox: { borderWidth: 2.5, borderColor: "#000", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  phone: { fontFamily: font.display, fontSize: 27, color: "#000" },
  ask: { fontFamily: font.headBold, fontSize: 17, color: "#000" },
  askS: { fontFamily: font.bodyRegular, fontSize: 11, lineHeight: 15, color: "#1E293B" },
  qr: { alignItems: "center", gap: 2 },
  qrT: { fontFamily: font.bodySemi, fontSize: 8, color: "#334155" },
  foot: { height: 26, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, backgroundColor: "#F8FAFC" },
  footT: { fontFamily: font.bodySemi, fontSize: 10, color: "#334155" },
});
