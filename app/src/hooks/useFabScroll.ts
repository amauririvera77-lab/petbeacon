import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useFab } from "../state/fab";

// Comportamiento ÚNICO del FAB en TODA la app (antes solo lo tenía la Home): expandido ("+ Report") al llegar arriba de una lista, se
// contrae al círculo de 73 px al bajar y se expande de nuevo al subir. Cada pantalla que conecta su ScrollView a `onScroll` se comporta
// igual. Al entrar a la pantalla (foco) siempre empieza expandido, como si estuvieras arriba del todo: antes solo la Home forzaba esto
// (al SALIR de ella), así que en el resto de pestañas el FAB podía quedar expandido de forma permanente, tapando controles.
export function useFabScroll() {
  const { setCollapsed } = useFab();
  const lastY = useRef(0);
  const reset = useCallback(() => { lastY.current = 0; setCollapsed(false); }, [setCollapsed]);
  useFocusEffect(reset);
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y, dy = y - lastY.current;
    if (Math.abs(dy) < 6) return;
    lastY.current = y;
    setCollapsed(y > 24 && dy > 0);
  }, [setCollapsed]);
  return { onScroll, reset };
}
