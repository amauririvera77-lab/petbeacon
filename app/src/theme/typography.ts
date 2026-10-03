import { font } from "./tokens";

// Escala tipográfica ("Warm Beacon"), 15 estilos definidos en Figma a partir del inventario de la Fase 4.
// Los componentes consumen SIEMPRE uno de estos — nunca fontSize, fontFamily ni fontWeight sueltos.
// Única excepción: components/flyer/FlyerTemplate.tsx (pieza impresa/exportada como imagen, no pantalla de la
// app — conserva su propia escala; ver el comentario en ese archivo y CLAUDE.md).
//
// No incluye color: el color de cada texto se define donde se usa (con los tokens de `Theme`), no aquí.
// Line-height en px = tamaño × porcentaje, redondeado al entero más cercano.
export const typography = {
  display28: { fontFamily: font.displayMedium, fontSize: 28, lineHeight: 34, letterSpacing: -0.28 }, // Geist SemiBold 28, 120%, -1%
  title24: { fontFamily: font.displayMedium, fontSize: 24, lineHeight: 29, letterSpacing: -0.24 }, // Geist SemiBold 24, 120%, -1%
  heading20: { fontFamily: font.head, fontSize: 20, lineHeight: 25 }, // Outfit SemiBold 20, 125%
  heading18: { fontFamily: font.head, fontSize: 18, lineHeight: 23 }, // Outfit SemiBold 18, 130%
  heading16: { fontFamily: font.head, fontSize: 16, lineHeight: 21 }, // Outfit SemiBold 16, 130%
  bodyLg16: { fontFamily: font.bodyRegular, fontSize: 16, lineHeight: 24 }, // Manrope Regular 16, 150%
  body14: { fontFamily: font.bodyRegular, fontSize: 14, lineHeight: 21 }, // Manrope Regular 14, 150%
  bodySm13: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19 }, // Manrope Regular 13, 145%
  label14: { fontFamily: font.bodySemi, fontSize: 14, lineHeight: 20 }, // Manrope SemiBold 14, 140%
  label13: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18 }, // Manrope SemiBold 13, 140%
  button16: { fontFamily: font.bodyBold, fontSize: 16, lineHeight: 19 }, // Manrope Bold 16, 120%
  button14: { fontFamily: font.bodyBold, fontSize: 14, lineHeight: 17 }, // Manrope Bold 14, 120%
  caption12: { fontFamily: font.bodyRegular, fontSize: 12, lineHeight: 17 }, // Manrope Regular 12, 140%
  badge12: { fontFamily: font.bodyBold, fontSize: 12, lineHeight: 14 }, // Manrope Bold 12, 120%
  // Solo badges de conteo y etiquetas de la tab bar (CLAUDE.md / Fase de consolidación tipográfica).
  micro11: { fontFamily: font.bodyBold, fontSize: 11, lineHeight: 13 }, // Manrope Bold 11, 120%
} as const;

// ÚNICA excepción a la escala (documentada también en CLAUDE.md): pares seleccionado/no-seleccionado que necesitan
// alternar el PESO de la fuente como señal redundante de accesibilidad, además del color — nunca tamaño ni
// line-height, para que el elemento no cambie de alto al alternar estado. Hoy solo lo usa StatusChips
// (Lost/Sighted): el estado inactivo toma `typography.button14` + este modificador (Bold → Regular).
export const weightOff = {
  button14: { fontFamily: font.bodyRegular },
  micro11: { fontFamily: font.bodyRegular },
} as const;
