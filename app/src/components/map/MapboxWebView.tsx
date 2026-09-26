import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import type { ReportNearby, ResourceNearby } from "../../lib/database.types";
import { C, font } from "../../theme/tokens";
import { buildMapHtml } from "./mapHtml";

export type MapSelection = { kind: "report" | "resource"; id: string } | null;

type Props = {
  token: string;
  reports: ReportNearby[];
  resources: ResourceNearby[];
  center: { lat: number; lng: number };
  radiusMi: number;
  focus?: { lat: number; lng: number } | null; // zona/dirección buscada: la cámara vuela allí
  mineIds?: string[]; // ids de los reportes del propio usuario (llevan aro y etiqueta "Your report")
  me?: { lat: number; lng: number; accuracy?: number | null } | null; // ubicación actual del dispositivo (punto negro pulsante + halo de precisión)
  alertRadiusMi?: number; // radio de alertas del perfil: se dibuja centrado en `me`
  selectedId?: string | null; // pin seleccionado (más grande y por encima)
  onSelect: (s: MapSelection) => void;
};

// Mapbox GL JS dentro de un WebView (funciona en Expo Go; el SDK nativo requeriría development build).
export type MapHandle = { recenter: () => void };

export const MapboxWebView = forwardRef<MapHandle, Props>(function MapboxWebView({ token, reports, resources, center, radiusMi, alertRadiusMi, selectedId, me, mineIds, focus, onSelect }, handle) {
  const ref = useRef<WebView>(null);
  useImperativeHandle(handle, () => ({ recenter: () => ref.current?.injectJavaScript("window.__recenter && window.__recenter(); true;") }), []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const html = useMemo(() => buildMapHtml(token), [token]);

  const push = useCallback(() => {
    const payload = {
      center: [center.lng, center.lat],
      radiusMi,
      alertRadiusMi: alertRadiusMi ?? radiusMi,
      selectedId: selectedId ?? null,
      me: me ? { lat: me.lat, lng: me.lng, accuracy: me.accuracy ?? null } : null,
      focus: focus ? { lat: focus.lat, lng: focus.lng } : null,
      reports: reports.map((r) => ({ id: r.id, status: r.status, lat: r.lat, lng: r.lng, mine: mineIds?.includes(r.id) ?? false })),
      resources: resources.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng })),
    };
    ref.current?.injectJavaScript(`window.__update(${JSON.stringify(payload)}); true;`);
  }, [reports, resources, center.lat, center.lng, radiusMi, alertRadiusMi, selectedId, me?.lat, me?.lng, me?.accuracy, mineIds, focus?.lat, focus?.lng]);

  useEffect(() => { if (ready) push(); }, [ready, push]);

  const onMessage = (e: WebViewMessageEvent) => {
    try {
      const m = JSON.parse(e.nativeEvent.data);
      if (m.type === "ready") setReady(true);
      else if (m.type === "error") setError(m.message);
      else if (m.type === "select") onSelect(m.id ? { kind: m.kind, id: m.id } : null);
    } catch {}
  };

  return (
    <View style={styles.fill}>
      <WebView
        ref={ref}
        source={{ html }}
        originWhitelist={["*"]}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        bounces={false}
        overScrollMode="never"
        style={styles.fill}
        onError={(ev) => setError(ev.nativeEvent.description)}
        onHttpError={(ev) => setError(`HTTP ${ev.nativeEvent.statusCode}`)}
      />
      {!ready && !error ? <View style={styles.overlay}><ActivityIndicator color={C.teal} /></View> : null}
      {error ? (
        <View style={[styles.overlay, { padding: 24 }]}>
          <Text style={styles.errT}>The map couldn't load</Text>
          <Text style={styles.errS}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.surface },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: C.surface, gap: 6 },
  errT: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  errS: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500, textAlign: "center" },
});
