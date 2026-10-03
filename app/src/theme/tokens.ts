// ── Primitivos ("Warm Beacon" — Figma "PetBeacon — UI Polish", frame "Foundations — Warm Beacon", node 2-3) ──
// Escala de color pura, sin significado de producto. Los tokens semánticos (`Theme`, abajo) apuntan aquí.
// Regla general: los componentes consumen SIEMPRE `Theme`, nunca `P` directo — ni siquiera para el punto de
// ubicación del usuario, que pasa por Theme.map.userLocation.
export const P = {
  black: { base: "#000000" }, // Figma: antes "teal/600", renombrado (mismo valor). Único uso tras el rebrand: Theme.map.userLocation (punto de ubicación del usuario y su halo).
  sky: { 600: "#0094D8", 50: "#EEF7FD" }, // Figma: antes "amber/600" y "amber/50", renombrado (mismo valor). Deprecated: ningún token semántico apunta a esta familia tras Fase 2.
  white: { base: "#FFFFFF" },
  pine: { 900: "#16302E", 800: "#1F4542", 700: "#2C5F5B", 500: "#4E7C79", 100: "#CFE0DC", 50: "#E6EFED" },
  coral: { 700: "#A9412D", 600: "#C4513B", 300: "#E5AE93", 50: "#FBEAE4" },
  dusk: { 700: "#33587F", 600: "#3F6A96", 300: "#7FA1C7", 50: "#E8EFF7" },
  sage: { 700: "#35704A", 500: "#6BAF68", 300: "#9BBC9F", 50: "#E7F2EA" },
  lavender: { 700: "#5A4E8C", 300: "#CBC6DF", 50: "#EFEDF6" },
  honey: { 700: "#8A5A12", 400: "#E0B06B", 50: "#FBF3E4" }, // Reservado para advertencias — sin token semántico ni uso todavía.
  neutral: { 900: "#22211F", 700: "#45423D", 500: "#6F6C66", 400: "#8F8B84", 300: "#CFCAC1", 200: "#E6E3DE", 100: "#F1EFEA", 50: "#F6F4F0" },
} as const;

// ── Semántico ("Warm Beacon") — mismos nombres que las variables de Figma, cada uno apuntando a un primitivo de `P`.
// Es la única capa de color que deben usar los componentes.
export const Theme = {
  brand: { primary: P.pine[800], tint: P.pine[50] },
  status: {
    // .border / .text: sin equivalente en la tabla de Figma (sección 2.1) — caja de aviso sobre `status.lost.tint`
    // (borde + texto legible encima). Igual que el resto: los componentes consumen esto, nunca `P.coral` directo.
    lost: { bg: P.coral[600], bgStrong: P.coral[700], tint: P.coral[50], border: P.coral[300], text: P.coral[700] },
    sighted: { bg: P.dusk[600], tint: P.dusk[50] },
    // .text: mismo criterio que status.lost.text — texto legible sobre reunited.tint (caja "case closed").
    reunited: { bg: P.sage[700], tint: P.sage[50], text: P.sage[700] },
  },
  info: { bg: P.lavender[700], tint: P.lavender[50] },
  // Error/peligro genérico (validación de formularios, acciones destructivas) — NO es el estado "Lost", aunque
  // comparta el primitivo coral. status.lost.* significa "este reporte está perdido"; danger.* significa "esto
  // es un error o una acción irreversible". Ninguno de los dos va como fondo de un botón de acción normal (brand.primary).
  danger: { bg: P.coral[700], text: P.coral[700], border: P.coral[600], tint: P.coral[50] },
  // Toggle (Figma "control/*", fase de congelación 4): track encendido/apagado y el círculo que se desliza. No es un
  // estado (status.*) ni una acción (brand.primary) — es el color propio del control. track-off sobre neutral/400 da
  // 3,4:1 en surface/card y 3,1:1 en surface/page (WCAG 1.4.11, contraste de componentes no textuales).
  control: { trackOn: P.pine[800], trackOff: P.neutral[400], knob: P.white.base },
  // Tile de categoría en Support (Figma "category/tile/*", fase de congelación 4/5): una sola combinación para las
  // 4 categorías — el significado lo llevan el ícono (ya distinto por categoría) y el filtro, no el color de fondo.
  category: { tile: { bg: P.pine[50], icon: P.pine[700] } },
  text: { primary: P.neutral[900], secondary: P.neutral[700], muted: P.neutral[500], onAccent: P.white.base },
  border: { default: P.neutral[200], strong: P.neutral[300] },
  surface: {
    page: P.neutral[50], card: P.white.base,
    inverse: P.neutral[900], // Fondo de Snackbar/toasts — nunca brand.primary, para no competir con los CTAs reales.
  },
  // Punto de ubicación del usuario y su halo en el mapa: el único lugar que se queda en negro tras el rebrand
  // (CLAUDE.md §2.3/§2.4). Los componentes leen Theme.map.userLocation, nunca P.black directo.
  map: { userLocation: P.black.base },
  // No es un token de Figma: reemplaza los rgba(15,23,42, alpha) de los scrims (fondo detrás de sheets/modales),
  // que usaban el RGB de C.ink a distintos alphas — ahora sobre neutral/900 (#22211F → rgb(34,33,31)).
  scrim: (alpha: number) => `rgba(34, 33, 31, ${alpha})`,
} as const;

export const font = {
  // Geist: display/headlines · Outfit: headers de pantalla y nombres · Manrope: cuerpo/UI
  display: "Geist_700Bold",
  displayMedium: "Geist_600SemiBold",
  head: "Outfit_600SemiBold",
  headBold: "Outfit_700Bold",
  body: "Manrope_500Medium",
  bodyRegular: "Manrope_400Regular",
  bodySemi: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
} as const;

export const radius = { sm: 6, md: 12, lg: 16, xl: 28, pill: 999 } as const; // sm: 8→6 (Fase 4, Warm Beacon) — no se usaba en ningún componente hoy
// Escala de espaciado (Fase 4, Warm Beacon) — agregada como referencia, todavía no reemplaza los números sueltos
// de padding/gap/margin de cada componente (esa migración queda para una fase posterior, pantalla por pantalla).
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32 } as const;
export const MIN_HIT = 44; // objetivo táctil mínimo
// Tab bar flotante (v1.1, Figma "TabBar — Floating"): contenedor con padding 8; su alto sale del contenido (cápsula 32 +
// gap 2 + etiqueta Micro/11 de 13 = 47) + 2 × 8 de padding + 2 × 1 de borde = 65. Report es un hueco de ancho fijo
// (botón de 56 + 4 de margen a cada lado); las cuatro pestañas se reparten el resto por igual.
export const TAB_BAR_PADDING = 8;
export const TAB_BAR_HEIGHT = 65;
export const TAB_BAR_SIDE_MARGIN = 16;
export const REPORT_BUTTON = { width: 56, height: 44, slot: 64 } as const;
export const FAB_SIZE = 73; // 56px base +30% (CLAUDE.md §3 y §7)
// Espacio inferior que necesita una lista para que su última tarjeta quede completa sobre el FAB: FAB + su margen (16) + respiro (16).
export const FAB_CLEARANCE = FAB_SIZE + 16 + 16;
