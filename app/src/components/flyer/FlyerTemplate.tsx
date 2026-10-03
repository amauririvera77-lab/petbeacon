import { shortAddress } from "../../lib/address";
import { breedLabel } from "../../lib/breeds";
import QRCode from "react-native-qrcode-svg";
import { StyleSheet, Text, View } from "react-native";
import type { FlyerReport } from "../../lib/flyer";
import { Theme, font } from "../../theme/tokens";
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
  const accent = lost ? Theme.status.lost.bg : Theme.status.sighted.bg;
  const title = r.name?.trim() || `Unknown ${r.species}`;
  const breed = breedLabel(r.breed, r.breed_id);
  const seen = `${when(r.created_at)}${r.location_label ? ` · ${shortAddress(r.location_label)}` : ""}`;

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
        {breed ? <Text style={styles.breed} numberOfLines={1}>{breed}</Text> : null}
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
            <QRCode value={url} size={lost && contact ? 72 : 84} color={Theme.text.primary} backgroundColor={Theme.surface.card} quietZone={4} />
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
  page: { width: FLYER_W, height: FLYER_H, backgroundColor: Theme.surface.card, overflow: "hidden" },
  head: { height: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  headT: { fontFamily: font.display, fontSize: 32, lineHeight: 38.4, letterSpacing: 2, color: Theme.text.onAccent },
  photo: { height: 140, backgroundColor: Theme.surface.page },
  info: { flex: 1, paddingHorizontal: 14, paddingTop: 8, gap: 1 },
  name: { fontFamily: font.headBold, fontSize: 26, lineHeight: 33.8, color: Theme.text.primary },
  breed: { fontFamily: font.body, fontSize: 13, lineHeight: 18.2, color: Theme.text.primary, marginBottom: 4 },
  label: { fontFamily: font.bodyBold, fontSize: 9, lineHeight: 12.6, letterSpacing: 1, color: Theme.text.secondary },
  seen: { fontFamily: font.bodyBold, fontSize: 12, lineHeight: 16.8, color: Theme.text.primary },
  features: { fontFamily: font.bodyRegular, fontSize: 11, lineHeight: 16.5, color: Theme.text.primary, marginTop: 3 },
  // Alto contraste deliberado (CLAUDE.md §5.7): borde y texto del teléfono en text.primary, no text.secondary — debe
  // leerse fotocopiado en blanco y negro.
  contact: { height: 96, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderTopWidth: 2, borderTopColor: Theme.text.primary },
  phoneBox: { borderWidth: 2.5, borderColor: Theme.text.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  phone: { fontFamily: font.display, fontSize: 27, lineHeight: 32.4, color: Theme.text.primary },
  ask: { fontFamily: font.headBold, fontSize: 17, lineHeight: 22.1, color: Theme.text.primary },
  askS: { fontFamily: font.bodyRegular, fontSize: 11, lineHeight: 16.5, color: Theme.text.primary },
  qr: { alignItems: "center", gap: 2 },
  qrT: { fontFamily: font.bodySemi, fontSize: 8, lineHeight: 11.2, color: Theme.text.secondary },
  foot: { height: 26, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, backgroundColor: Theme.surface.page },
  footT: { fontFamily: font.bodySemi, fontSize: 10, lineHeight: 14, color: Theme.text.secondary },
});
