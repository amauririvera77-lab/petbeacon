import { Theme } from "../../theme/tokens";
import { PIN_ICONS } from "./icons";

const GL_VERSION = "3.10.0";

// Documento que corre dentro del WebView. Protocolo:
//   RN → WebView:  window.__update({ reports, resources, center:[lng,lat], radiusMi })
//   WebView → RN:  postMessage JSON { type: "ready" | "select" | "error", ... }
export function buildMapHtml(token: string): string {
  const colors = { lost: Theme.status.lost.bg, sighted: Theme.status.sighted.bg, reunited: Theme.status.reunited.bg, resource: Theme.info.bg };
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link href="https://api.mapbox.com/mapbox-gl-js/v${GL_VERSION}/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v${GL_VERSION}/mapbox-gl.js"></script>
<style>html,body,#map{margin:0;padding:0;width:100%;height:100%;background:${Theme.surface.page}}</style>
</head><body><div id="map"></div>
<script>
(function () {
  var COLORS = ${JSON.stringify(colors)};
  var ICONS = ${JSON.stringify(PIN_ICONS)};
  var ICON_FOR = { lost: "siren", sighted: "eye", reunited: "check", resource: "heart-handshake" };
  function post(m) { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }

  if (typeof mapboxgl === "undefined") { post({ type: "error", message: "Mapbox GL JS failed to load (offline?)" }); return; }
  mapboxgl.accessToken = ${JSON.stringify(token)};
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/light-v11",
    center: [-73.7629, 41.034], zoom: 11,
    attributionControl: false, dragRotate: false, pitchWithRotate: false
  });
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");
  map.touchZoomRotate.disableRotation();

  var loaded = false, pending = null, lastP = null, lastRadius = null, meOn = false, lastFocus = null;

  // Pin en gota (fase 5.3): la PUNTA es el punto exacto del reporte (icon-anchor "bottom"); el ícono va en la cabeza.
  function pinSvg(color, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="88" height="112" viewBox="0 0 44 56">' +
      '<path d="M22 54C22 54 3 34 3 22a19 19 0 0 1 38 0C41 34 22 54 22 54Z" fill="' + color + '" stroke="${Theme.text.onAccent}" stroke-width="3" stroke-linejoin="round"/>' +
      '<g transform="translate(10 10)" fill="none" stroke="${Theme.text.onAccent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</g></svg>';
  }
  function loadIcon(name, color, inner) {
    return new Promise(function (resolve) {
      var img = new Image(88, 112);
      img.onload = function () { if (!map.hasImage(name)) map.addImage(name, img, { pixelRatio: 2 }); resolve(); };
      img.onerror = resolve;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(pinSvg(color, inner));
    });
  }

  // Círculo geodésico del radio de alerta (millas → metros).
  function circle(lng, lat, radiusMi) {
    var pts = [], R = 6371008.8, d = radiusMi * 1609.344 / R, la = lat * Math.PI / 180, lo = lng * Math.PI / 180;
    for (var i = 0; i <= 64; i++) {
      var b = 2 * Math.PI * i / 64;
      var la2 = Math.asin(Math.sin(la) * Math.cos(d) + Math.cos(la) * Math.sin(d) * Math.cos(b));
      var lo2 = lo + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(la), Math.cos(d) - Math.sin(la) * Math.sin(la2));
      pts.push([lo2 * 180 / Math.PI, la2 * 180 / Math.PI]);
    }
    return pts;
  }

  function apply(p) {
    var feats = [], solo = [];
    (p.reports || []).forEach(function (r) {
      var f = { type: "Feature", geometry: { type: "Point", coordinates: [r.lng, r.lat] },
        properties: { kind: "report", rid: r.id, icon: r.status, mine: !!r.mine, sel: r.id === p.selectedId } };
      // Pines que NUNCA se agrupan (fuente "solo", sin cluster): TODOS los Lost (un Lost nunca queda escondido dentro de un cluster) y los
      // avistamientos que coinciden con un Lost del usuario. Solo Sighted y Reunited se agrupan.
      if (r.matchName) f.properties.matchName = r.matchName;
      if (r.status === "lost" || r.matchName) solo.push(f); else feats.push(f);
    });
    (p.resources || []).forEach(function (r) {
      // Los recursos (en Home, solo eventos vigentes) tampoco se agrupan nunca.
      solo.push({ type: "Feature", geometry: { type: "Point", coordinates: [r.lng, r.lat] },
        properties: { kind: "resource", rid: r.id, icon: "resource" } });
    });
    map.getSource("items").setData({ type: "FeatureCollection", features: feats });
    map.getSource("solo").setData({ type: "FeatureCollection", features: solo });
    lastP = p;
    // Círculo del radio de ALERTA centrado en tu ubicación real (o en tu zona si no hay GPS). El encuadre sigue el radio de vista.
    var ac = p.me ? [p.me.lng, p.me.lat] : p.center;
    map.getSource("radius").setData({ type: "Feature", geometry: { type: "Polygon", coordinates: [circle(ac[0], ac[1], p.alertRadiusMi || p.radiusMi)] } });
    var ring = circle(p.center[0], p.center[1], p.radiusMi);
    // Halo de precisión: radio real del GPS en metros (con tope, para que un fix malo no cubra media ciudad).
    map.getSource("accuracy").setData(p.me && p.me.accuracy
      ? { type: "Feature", geometry: { type: "Polygon", coordinates: [circle(p.me.lng, p.me.lat, Math.min(p.me.accuracy, 400) / 1609.344)] } }
      : { type: "FeatureCollection", features: [] });
    meOn = !!p.me;   // punto "tú": ubicación actual del dispositivo (null si no hay permiso)
    map.getSource("me").setData(p.me
      ? { type: "Feature", geometry: { type: "Point", coordinates: [p.me.lng, p.me.lat] }, properties: {} }
      : { type: "FeatureCollection", features: [] });
    // Búsqueda de zona/dirección (fase 4.3, modo Map): la cámara vuela al resultado y se marca; al limpiarla vuelve al encuadre del radio.
    var fk = p.focus ? p.focus.lng + "," + p.focus.lat : null;
    map.getSource("focus").setData(p.focus
      ? { type: "Feature", geometry: { type: "Point", coordinates: [p.focus.lng, p.focus.lat] }, properties: {} }
      : { type: "FeatureCollection", features: [] });
    if (fk !== lastFocus) {
      lastFocus = fk;
      if (p.focus) map.flyTo({ center: [p.focus.lng, p.focus.lat], zoom: 14 });
      else lastRadius = null;
    }
    if (!p.focus && lastRadius !== p.radiusMi) {   // re-encuadra solo cuando cambia el radio, no en cada refresco de datos
      lastRadius = p.radiusMi;
      // Encuadre por los reportes cercanos, no por el círculo completo del radio: con pocos reportes cerca del
      // centro, encuadrar el círculo (p. ej. 10 mi) los deja diminutos. Si no hay ninguno todavía, se usa el
      // círculo como contexto (mejor eso que un mapa vacío sin ninguna referencia de escala).
      var reportPts = (p.reports || []).map(function (r) { return [r.lng, r.lat]; });
      var b = new mapboxgl.LngLatBounds();
      if (reportPts.length) {
        reportPts.forEach(function (c) { b.extend(c); });
        map.fitBounds(b, { padding: 56, maxZoom: 14, duration: 500 });
      } else {
        ring.forEach(function (c) { b.extend(c); });
        map.fitBounds(b, { padding: 32, duration: 500 });
      }
    }
  }

  window.__recenter = function () {
    if (!lastP) return;
    var c = lastP.me ? [lastP.me.lng, lastP.me.lat] : lastP.center;
    map.flyTo({ center: c, zoom: 14, duration: 600 });
  };
  window.__update = function (p) { if (loaded) apply(p); else pending = p; };

  map.on("load", function () {
    Promise.all(Object.keys(ICON_FOR).map(function (k) {
      return loadIcon("pin-" + k, COLORS[k], ICONS[ICON_FOR[k]]);
    })).then(function () {
      map.addSource("radius", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "${Theme.text.primary}", "fill-opacity": 0.04 } });
      map.addLayer({ id: "radius-line", type: "line", source: "radius", paint: { "line-color": "${Theme.text.primary}", "line-opacity": 0.35, "line-width": 1.5, "line-dasharray": [2, 2] } });

      map.addSource("items", { type: "geojson", data: { type: "FeatureCollection", features: [] }, cluster: true, clusterRadius: 48, clusterMaxZoom: 14 });
      map.addLayer({ id: "clusters", type: "circle", source: "items", filter: ["has", "point_count"],
        paint: { "circle-color": "${Theme.brand.primary}", "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 30], "circle-stroke-width": 3, "circle-stroke-color": "${Theme.text.onAccent}" } });
      map.addLayer({ id: "cluster-count", type: "symbol", source: "items", filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"], "text-size": 14, "text-allow-overlap": true },
        paint: { "text-color": "${Theme.text.onAccent}" } });
      map.addLayer({ id: "pins", type: "symbol", source: "items", filter: ["!", ["has", "point_count"]],
        layout: { "icon-image": ["concat", "pin-", ["get", "icon"]], "icon-anchor": "bottom", "icon-allow-overlap": true, "icon-size": ["interpolate", ["linear"], ["zoom"], 9, ["case", ["==", ["get", "sel"], true], 0.66, 0.55], 12, ["case", ["==", ["get", "sel"], true], 0.96, 0.8], 14, ["case", ["==", ["get", "sel"], true], 1.08, 0.9]], "symbol-sort-key": ["case", ["==", ["get", "sel"], true], 1, 0] } });

      // Pines de la fuente "solo" (Lost, avistamientos que coinciden con un Lost tuyo, eventos): a zoom alto SIEMPRE
      // sueltos (nunca se esconde un Lost dentro de un cluster ahí), pero por debajo de clusterMaxZoom (14, mismo
      // umbral que "items") también se agrupan — a 10 mi sin esto se apilaban en una pila ilegible. clusterProperties
      // cuenta cuántos del cluster son Lost (lost_count): el cluster se pinta en status.lost.bg y muestra ESE número
      // en vez del total si contiene al menos uno; si no, se pinta neutro (brand.primary) como los clusters de "items".
      map.addSource("solo", { type: "geojson", data: { type: "FeatureCollection", features: [] },
        cluster: true, clusterRadius: 48, clusterMaxZoom: 14,
        clusterProperties: { lost_count: ["+", ["case", ["==", ["get", "icon"], "lost"], 1, 0]] } });
      map.addLayer({ id: "solo-clusters-lost", type: "circle", source: "solo", filter: ["all", ["has", "point_count"], [">", ["get", "lost_count"], 0]],
        paint: { "circle-color": "${Theme.status.lost.bg}", "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 30], "circle-stroke-width": 3, "circle-stroke-color": "${Theme.text.onAccent}" } });
      map.addLayer({ id: "solo-clusters-other", type: "circle", source: "solo", filter: ["all", ["has", "point_count"], ["==", ["get", "lost_count"], 0]],
        paint: { "circle-color": "${Theme.brand.primary}", "circle-radius": ["step", ["get", "point_count"], 18, 10, 24, 50, 30], "circle-stroke-width": 3, "circle-stroke-color": "${Theme.text.onAccent}" } });
      map.addLayer({ id: "solo-cluster-count", type: "symbol", source: "solo", filter: ["has", "point_count"],
        layout: { "text-field": ["case", [">", ["get", "lost_count"], 0], ["get", "lost_count"], ["get", "point_count_abbreviated"]], "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"], "text-size": 14, "text-allow-overlap": true },
        paint: { "text-color": "${Theme.text.onAccent}" } });
      // Reporte propio: aro ink (el mismo criterio que en la Fase 2). Coincidencia: aro con el token de éxito.
      // Ninguno de los dos aplica a un cluster (una feature de cluster no trae mine/matchName, solo point_count).
      map.addLayer({ id: "pins-mine-ring", type: "circle", source: "solo", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "mine"], true]],
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 15, 12, 22, 14, 25], "circle-translate": ["interpolate", ["linear"], ["zoom"], 9, ["literal", [0, -19]], 12, ["literal", [0, -27]], 14, ["literal", [0, -31]]], "circle-color": "rgba(0,0,0,0)", "circle-stroke-width": 2.5, "circle-stroke-color": "${Theme.text.primary}" } });
      map.addLayer({ id: "pins-match-ring", type: "circle", source: "solo", filter: ["all", ["!", ["has", "point_count"]], ["has", "matchName"]],
        paint: { "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 15, 12, 22, 14, 25], "circle-translate": ["interpolate", ["linear"], ["zoom"], 9, ["literal", [0, -19]], 12, ["literal", [0, -27]], 14, ["literal", [0, -31]]], "circle-color": "rgba(0,0,0,0)", "circle-stroke-width": 3, "circle-stroke-color": "${Theme.status.reunited.bg}" } });
      map.addLayer({ id: "pins-solo", type: "symbol", source: "solo", filter: ["!", ["has", "point_count"]],
        layout: { "icon-image": ["concat", "pin-", ["get", "icon"]], "icon-anchor": "bottom", "icon-allow-overlap": true, "icon-size": ["interpolate", ["linear"], ["zoom"], 9, ["case", ["==", ["get", "sel"], true], 0.66, 0.55], 12, ["case", ["==", ["get", "sel"], true], 0.96, 0.8], 14, ["case", ["==", ["get", "sel"], true], 1.08, 0.9]], "symbol-sort-key": ["case", ["==", ["get", "sel"], true], 1, 0] } });
      // Etiquetas: Mapbox coloca primero los símbolos de las capas SUPERIORES, así que "Your report" (arriba) gana a "Match for …" si chocan.
      map.addLayer({ id: "pins-match-label", type: "symbol", source: "solo", filter: ["all", ["!", ["has", "point_count"]], ["has", "matchName"]],
        layout: { "text-field": ["concat", "Match for ", ["get", "matchName"]], "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"], "text-size": 11, "text-offset": ["interpolate", ["linear"], ["zoom"], 9, ["literal", [0, -3.8]], 12, ["literal", [0, -5.2]], 14, ["literal", [0, -5.9]]], "text-anchor": "bottom", "text-allow-overlap": false },
        paint: { "text-color": "${Theme.status.reunited.bg}", "text-halo-color": "${Theme.text.onAccent}", "text-halo-width": 2 } });
      map.addLayer({ id: "pins-mine-label", type: "symbol", source: "solo", filter: ["all", ["!", ["has", "point_count"]], ["==", ["get", "mine"], true]],
        layout: { "text-field": "Your report", "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"], "text-size": 11, "text-offset": ["interpolate", ["linear"], ["zoom"], 9, ["literal", [0, -3.8]], 12, ["literal", [0, -5.2]], 14, ["literal", [0, -5.9]]], "text-anchor": "bottom", "text-allow-overlap": false },
        paint: { "text-color": "${Theme.text.primary}", "text-halo-color": "${Theme.text.onAccent}", "text-halo-width": 2 } });

      // Resultado de la búsqueda de zona: punto blanco con borde brand.primary (distinto del punto negro de "tú" y del aro "Your report").
      map.addSource("focus", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "focus-dot", type: "circle", source: "focus", paint: { "circle-color": "${Theme.surface.card}", "circle-radius": 8, "circle-stroke-width": 3, "circle-stroke-color": "${Theme.brand.primary}" } });

      // Ubicación actual: SIEMPRE por encima de clusters y pines (se añade la última, sin capa de referencia). Se distingue de un cluster
      // por FORMA, no por color (ambos son oscuros): punto pequeño y sin número (6 px + borde blanco de 4 px), rodeado de un halo negro
      // semitransparente claramente MÁS GRANDE que cualquier cluster (34 px de radio; un cluster mide 18–30) y un pulso sutil en ese halo.
      // Además, el halo de precisión real del GPS (en metros).
      map.addSource("accuracy", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "me-accuracy", type: "fill", source: "accuracy", paint: { "fill-color": "${Theme.map.userLocation}", "fill-opacity": 0.08 } });
      map.addLayer({ id: "me-accuracy-line", type: "line", source: "accuracy", paint: { "line-color": "${Theme.map.userLocation}", "line-opacity": 0.25, "line-width": 1 } });
      map.addSource("me", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({ id: "me-halo", type: "circle", source: "me", paint: { "circle-color": "${Theme.map.userLocation}", "circle-radius": 34, "circle-opacity": 0.12, "circle-stroke-width": 1.5, "circle-stroke-color": "${Theme.map.userLocation}", "circle-stroke-opacity": 0.3 } });
      map.addLayer({ id: "me-pulse", type: "circle", source: "me", paint: { "circle-color": "${Theme.map.userLocation}", "circle-radius": 10, "circle-opacity": 0 } });
      map.addLayer({ id: "me-dot", type: "circle", source: "me", paint: { "circle-color": "${Theme.map.userLocation}", "circle-radius": 6, "circle-stroke-width": 4, "circle-stroke-color": "${Theme.surface.card}" } });
      // El pulso respeta la preferencia del sistema "reducir movimiento": con ella activa el halo queda quieto.
      var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
      var reduce = !!(mq && mq.matches);
      if (mq && mq.addEventListener) mq.addEventListener("change", function (e) { reduce = e.matches; });
      var t0 = performance.now();
      (function pulse(now) {
        if (meOn && map.getLayer("me-pulse")) {
          if (reduce) map.setPaintProperty("me-pulse", "circle-opacity", 0);
          else {
            var k = ((now - t0) % 2400) / 2400;
            map.setPaintProperty("me-pulse", "circle-radius", 10 + 24 * k);
            map.setPaintProperty("me-pulse", "circle-opacity", 0.28 * (1 - k));
          }
        }
        requestAnimationFrame(pulse);
      })(t0);

      function expandCluster(sourceId) {
        return function (e) {
          var f = e.features[0];
          map.getSource(sourceId).getClusterExpansionZoom(f.properties.cluster_id, function (err, z) {
            if (!err) map.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 });
          });
        };
      }
      map.on("click", "clusters", expandCluster("items"));
      map.on("click", "solo-clusters-lost", expandCluster("solo"));
      map.on("click", "solo-clusters-other", expandCluster("solo"));
      map.on("click", "pins-solo", function (e) {
        var p = e.features[0].properties;
        post({ type: "select", kind: p.kind, id: p.rid });
      });
      map.on("click", "pins", function (e) {
        var p = e.features[0].properties;
        post({ type: "select", kind: p.kind, id: p.rid });
      });
      var CLICKABLE = ["pins", "pins-solo", "clusters", "solo-clusters-lost", "solo-clusters-other"];
      map.on("click", function (e) {
        if (!map.queryRenderedFeatures(e.point, { layers: CLICKABLE }).length) post({ type: "select", kind: null, id: null });
      });
      CLICKABLE.forEach(function (l) {
        map.on("mouseenter", l, function () { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", l, function () { map.getCanvas().style.cursor = ""; });
      });

      loaded = true;
      post({ type: "ready" });
      if (pending) { apply(pending); pending = null; }
    });
  });

  var errored = false;
  map.on("error", function (e) {
    var status = e && e.error && e.error.status, msg = (e && e.error && e.error.message) || "";
    if (!errored && (status === 401 || status === 403 || /token|unauthor/i.test(msg))) {
      errored = true; post({ type: "error", message: msg || "Mapbox token rejected (" + status + ")" });
    }
  });
})();
</script></body></html>`;
}
