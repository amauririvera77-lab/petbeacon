import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useFab } from "../state/fab";

// Oculta el FAB compartido mientras esta pantalla tiene el foco, y lo libera al salir (Fase 3 de congelación: Profile
// no muestra FAB). Mismo patrón que useFabScroll (useFocusEffect, no un useEffect con []): así funciona igual al
// navegar entre pestañas (que no desmontan la pantalla) que al entrar/salir de la app.
export function useFabHidden() {
  const { setHidden } = useFab();
  useFocusEffect(useCallback(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]));
}
