// Estilo compartido por nivel de elevación ("Warm Beacon", Fase 3). Un solo lugar en el código: no repetir
// shadowColor/shadowOpacity/shadowRadius en cada componente.
//
// Usa `boxShadow` (prop de View, sintaxis CSS, RN New Architecture) en vez de shadow*/elevation por separado:
// se ve IGUAL en iOS y Android (mismo motor de render) y permite las dos capas de sombra reales que pide cada
// nivel, sin aproximar con una sola. El proyecto corre New Architecture obligatoria (react-native 0.86), así
// que no hace falta fallback para Old Architecture.
//
// Color de sombra: siempre neutral/900 (#22211F → rgb(34, 33, 31)), nunca negro puro.
const SHADOW_RGB = "34, 33, 31";

export const elevation = {
  // Controles del mapa (chip de radio, recentrar) y la cabecera de Home cuando el contenido pasa por debajo al hacer scroll.
  1: { boxShadow: `0px 1px 2px rgba(${SHADOW_RGB}, 0.06), 0px 1px 4px rgba(${SHADOW_RGB}, 0.08)` },
  // FAB, tarjeta de vista previa de un pin, toasts.
  2: { boxShadow: `0px 4px 8px -2px rgba(${SHADOW_RGB}, 0.08), 0px 10px 20px -4px rgba(${SHADOW_RGB}, 0.12)` },
  // Bottom sheets y diálogos: sombra hacia ARRIBA (offset Y negativo), la hoja se separa del contenido que queda debajo.
  3: { boxShadow: `0px -2px 8px rgba(${SHADOW_RGB}, 0.06), 0px -8px 32px -4px rgba(${SHADOW_RGB}, 0.14)` },
} as const;
