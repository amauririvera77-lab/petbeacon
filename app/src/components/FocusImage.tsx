import { Image, type ImageContentPosition, type ImageStyle } from "expo-image";
import type { StyleProp, ViewStyle } from "react-native";

type Props = {
  uri: string;
  focusX?: number | null; // % del ancho (0-100) donde está el sujeto (cabeza). null/undefined = centro.
  focusY?: number | null; // % del alto (0-100).
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  onError?: () => void;
  onReady?: () => void; // la imagen ya se dibujó (necesario antes de capturar un flyer)
};

// Recorte con punto focal, vía expo-image (contentFit="cover" + contentPosition — igual que object-position en
// CSS), en vez del cálculo manual anterior con Image.getSize(): ese cálculo dependía de que las dimensiones que
// reportaba la red coincidieran exactamente con lo que el visor nativo terminaba dibujando, y en dispositivo real
// se desalineaban (la cara quedaba cortada) de una forma que no se podía reproducir en el navegador. contentPosition
// lo resuelve el propio decodificador nativo, sin esa carrera.
//
// Sin foco conocido (fotos subidas desde la app, antes de que el usuario elija una) usa el centro — el default de
// contentPosition, sin necesidad de indicarlo.
export function FocusImage({ uri, focusX, focusY, style, accessibilityLabel, onError, onReady }: Props) {
  const contentPosition: ImageContentPosition = { left: `${focusX ?? 50}%`, top: `${focusY ?? 50}%` };
  return (
    <Image
      source={{ uri }}
      contentFit="cover"
      contentPosition={contentPosition}
      style={style as StyleProp<ImageStyle>}
      accessibilityLabel={accessibilityLabel}
      onError={() => onError?.()}
      onLoad={() => onReady?.()}
    />
  );
}
