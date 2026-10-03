import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// Preferencia del sistema "Reduce Motion" (iOS/Android): las animaciones que solo son decorativas (como la cápsula
// de la tab bar) deben respetarla y aparecer/desaparecer sin transición cuando está activa.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { if (mounted) setReduced(v); });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => { mounted = false; sub.remove(); };
  }, []);
  return reduced;
}
