import { Text, type TextProps } from "react-native";

// Texto de la app (v1.1, contención del tamaño de texto dinámico). Envuelve `Text` de React Native y le pone el tope de
// `maxFontSizeMultiplier` según el ROL del texto, para que el "texto más grande" del sistema no rompa los contenedores de
// altura fija. La solución completa (tarjetas que admiten 2 líneas, lineHeight por encima de la altura natural) queda para
// la etapa B — ver CLAUDE.md. `Text.defaultProps` no sirve con React 19, por eso es un componente y no un ajuste global.
//   tab      — etiquetas de la barra de pestañas (Micro/11): tope 1.0, la barra flotante tiene alto fijo.
//   control  — botones, chips, badges y demás controles compactos (Button/16, Button/14, Badge/12, Micro/11 en badges): 1.3.
//   title    — títulos grandes (Display/28, Title/24): 1.5.
//   reading  — texto de lectura (Heading, Body, Label, Caption): 1.5 por ahora; subirá a 2.0 cuando las tarjetas admitan 2 líneas.
export type TextRole = "tab" | "control" | "title" | "reading";

export const FONT_SCALE_CAP: Record<TextRole, number> = { tab: 1.0, control: 1.3, title: 1.5, reading: 1.5 };

// `role` de RN (ARIA) no se usa en Text en esta app; aquí `role` es el rol tipográfico, por eso se omite del tipo de RN.
export type AppTextProps = Omit<TextProps, "role"> & { role?: TextRole };

export function AppText({ role = "reading", maxFontSizeMultiplier, ...rest }: AppTextProps) {
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier ?? FONT_SCALE_CAP[role]} {...rest} />;
}
