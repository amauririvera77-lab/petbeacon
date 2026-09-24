// Fuente de verdad: objeto `C` del prototipo (CLAUDE.md §3).
export const C = {
  sos: "#EC4832", sosDark: "#C43A1F", sosTint: "#FDECE4", // Lost
  warn: "#0094D8", warnTint: "#EEF7FD", // Sighted
  ok: "#429D64", okTint: "#E4F5E9", // Reunited
  teal: "#000000", tealTint: "#DDEAE7", // Marca/acento (negro deliberado)
  info: "#1D4ED8", infoTint: "#E4EAFB", // Recurso comunitario
  ink: "#0F172A", slate700: "#334155", slate500: "#64748B",
  border: "#E2E8F0", border2: "#CBD5E1", surface: "#F8FAFC", white: "#FFFFFF",
  // Colores que el prototipo usa en línea y no estaban en `C` (texto secundario, estado seleccionado y aviso de alerta):
  slate600: "#475569", selectBg: "#EEF2F6", sosBorder: "#F7C9B4", sosInk: "#7C2D12",
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

export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const MIN_HIT = 44; // objetivo táctil mínimo
export const FAB_SIZE = 73; // 56px base +30% (CLAUDE.md §3 y §7)
