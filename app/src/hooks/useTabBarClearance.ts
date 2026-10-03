import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_HEIGHT, spacing } from "../theme/tokens";

// Distancia entre el borde inferior de la pantalla y la tab bar flotante: sigue la safe area real (home indicator), con un mínimo de 12.
export const tabBarBottomDistance = (insetBottom: number) => Math.max(insetBottom - 8, 12);

// TAB_BAR_CLEARANCE: lo que ocupa la barra desde el borde inferior + un respiro estándar (spacing.lg) — el espacio que
// necesita el contenido desplazable para que su último elemento quede completo sobre la barra, y la base donde se apoyan
// los controles flotantes (tarjeta de vista previa del mapa, recentrar, snackbar, atribución de Mapbox). No es una
// constante fija porque depende de la safe area del dispositivo.
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + tabBarBottomDistance(insets.bottom) + spacing.lg;
}
