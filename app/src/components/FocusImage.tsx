import { useEffect, useState } from "react";
import { Image, LayoutChangeEvent, StyleProp, View, ViewStyle } from "react-native";

const sizeCache = new Map<string, { w: number; h: number }>();

type Props = {
  uri: string;
  focusX?: number | null; // % del ancho donde está el sujeto (cabeza)
  focusY?: number | null; // % del alto
  zoom?: number; // 1 = "cover"; >1 acerca al punto focal (miniaturas)
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  onError?: () => void;
  onReady?: () => void; // la imagen ya se dibujó (necesario antes de capturar un flyer)
};

// Equivale a `object-position` + zoom del prototipo. Un "cover" centrado corta la cabeza en fotos verticales;
// aquí la imagen se escala hasta cubrir el contenedor (× zoom) y se desplaza para que el punto focal quede en el centro,
// sin dejar bordes vacíos. Sin foco conocido usa (50%, 30%): las cabezas suelen estar en el tercio superior.
export function FocusImage({ uri, focusX, focusY, zoom = 1, style, accessibilityLabel, onError, onReady }: Props) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(sizeCache.get(uri) ?? null);

  useEffect(() => {
    if (nat) return;
    let alive = true;
    Image.getSize(uri, (w, h) => { sizeCache.set(uri, { w, h }); if (alive) setNat({ w, h }); }, () => onError?.());
    return () => { alive = false; };
  }, [uri, nat, onError]);

  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  let img: React.ReactNode = null;
  if (box && nat && box.w > 0 && box.h > 0) {
    const s = Math.max(box.w / nat.w, box.h / nat.h) * Math.max(zoom, 1);
    const iw = nat.w * s, ih = nat.h * s;
    const fx = ((focusX ?? 50) / 100) * iw, fy = ((focusY ?? 30) / 100) * ih;
    const left = Math.min(0, Math.max(box.w - iw, box.w / 2 - fx));
    const top = Math.min(0, Math.max(box.h - ih, box.h / 2 - fy));
    img = <Image source={{ uri }} resizeMode="stretch" style={{ position: "absolute", left, top, width: iw, height: ih }} accessibilityLabel={accessibilityLabel} onError={onError} onLoad={onReady} />;
  }
  return <View onLayout={onLayout} style={[{ overflow: "hidden" }, style]}>{img}</View>;
}
