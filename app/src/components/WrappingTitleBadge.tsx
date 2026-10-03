import { View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { AppText } from "./AppText";
import { Badge, type BadgeStatus } from "./Badge";

// Título de varias líneas con un badge que se comporta como si fuera su última palabra: si cabe al final de la
// última línea queda ahí, con la misma separación que el resto de palabras; si no cabe, pasa a la siguiente línea,
// alineado a la izquierda — igual que el texto normal al envolver.
//
// Por qué cada palabra es su propio Text: un <AppText> multilínea y un badge hermano (en una fila normal) no pueden
// fluir juntos — flexbox no deja que un ítem hermano se "cuele" dentro del wrap de un Text; el badge queda pegado
// al layout de la fila completa (típicamente en el extremo, alineado con la PRIMERA línea del texto), no después
// de la última palabra. Partiendo el título en palabras, cada una es su propio ítem de flex, y flexWrap + gap sí
// dejan que el badge fluya como un ítem más — al costo de un espacio entre palabras igual al `gap` (en vez del
// espaciado tipográfico normal de una palabra suelta), que es el mismo `gap` que separa la última palabra del badge.
export function WrappingTitleBadge({ title, status, textStyle, style, gap = 8 }: {
  title: string; status: BadgeStatus; textStyle: StyleProp<TextStyle>; style?: StyleProp<ViewStyle>; gap?: number;
}) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return (
    <View style={[{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", columnGap: gap, rowGap: 4 }, style]}>
      {words.map((w, i) => <AppText key={i} style={textStyle}>{w}</AppText>)}
      <Badge status={status} sitOnBaseline />
    </View>
  );
}
