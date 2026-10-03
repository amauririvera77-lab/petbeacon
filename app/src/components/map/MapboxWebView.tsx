import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import type { ReportNearby, ResourceNearby } from "../../lib/database.types";
import { Theme } from "../../theme/tokens";
import { typography } from "../../theme/typography";
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
  matchNames?: Record<string, string>; // id de avistamiento → nombre de tu mascota (coincidencias no descartadas): pin con aro de éxito y sin cluster
  alertRadiusMi?: number; // radio de alertas del perfil: se dibuja centrado en `me`
  selectedId?: string | null; // pin seleccionado (más grande y por encima)
  bottomInset?: number; // px que tapa la tab bar flotante abajo: atribución/logo de Mapbox y encuadre quedan por encima
  onSelect: (s: MapSelection) => void;
};

// Mapbox GL JS dentro de un WebView (funciona en Expo Go; el SDK nativo requeriría development build).
export type MapHandle = { recenter: () => void };

export const MapboxWebView = forwardRef<MapHandle, Props>(function MapboxWebView({ token, reports, resources, center, radiusMi, alertRadiusMi, selectedId, matchNames, me, mineIds, focus, bottomInset = 0, onSelect }, handle) {
  const ref = useRef<WebView>(null);
  useImperativeHandle(handle, () => ({ recenter: () => ref.current?.injectJavaScript("window.__recenter && window.__recenter(); true;") }), []);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El inset INICIAL va en el HTML; los cambios posteriores (p. ej. abrir la vista previa de un pin) se inyectan sin recargar el mapa.
  const [initialInset] = useState(bottomInset);
  const html = useMemo(() => buildMapHtml(token, initialInset), [token, initialInset]);

  const push = useCallback(() => {
    const payload = {
      center: [center.lng, center.lat],
      radiusMi,
      alertRadiusMi: alertRadiusMi ?? radiusMi,
      selectedId: selectedId ?? null,
      me: me ? { lat: me.lat, lng: me.lng, accuracy: me.accuracy ?? null } : null,
      focus: focus ? { lat: focus.lat, lng: focus.lng } : null,
      reports: reports.map((r) => ({ id: r.id, status: r.status, lat: r.lat, lng: r.lng, mine: mineIds?.includes(r.id) ?? false, matchName: matchNames?.[r.id] ?? null })),
      resources: resources.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng })),
    };
    ref.current?.injectJavaScript(`window.__update(${JSON.stringify(payload)}); true;`);
  }, [reports, resources, center.lat, center.lng, radiusMi, alertRadiusMi, selectedId, matchNames, me?.lat, me?.lng, me?.accuracy, mineIds, focus?.lat, focus?.lng]);

  useEffect(() => { if (ready) push(); }, [ready, push]);
  useEffect(() => { if (ready) ref.current?.injectJavaScript(`window.__setInset && window.__setInset(${bottomInset}); true;`); }, [ready, bottomInset]);

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
      {!ready && !error ? <View style={styles.overlay}><ActivityIndicator color={Theme.brand.primary} /></View> : null}
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
  fill: { flex: 1, backgroundColor: Theme.surface.page },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: Theme.surface.page, gap: 6 },
  errT: { ...typography.label14, color: Theme.text.primary },
  errS: { ...typography.bodySm13, color: Theme.text.muted, textAlign: "center" },
});
