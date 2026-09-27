import { router } from "expo-router";
import type { useOnboardingPreview } from "../state/onboardingPreview";
import { useSession } from "../state/session";

type S = ReturnType<typeof useSession>;
type Preview = ReturnType<typeof useOnboardingPreview>;

// Cierra el onboarding. Si la intención fue reportar, abre el flujo correspondiente (no el feed vacío).
//
// `preview` (herramienta de diseño, "Replay onboarding"): mientras está activa, NUNCA se abre un flujo real de reporte o mascota —
// eso sí escribiría datos de verdad en Supabase aunque el resto del onboarding esté aislado. En su lugar, solo se apaga la vista
// previa y se vuelve a Profile, tal como estaba.
export function finishOnboarding(s: S, preview?: Preview) {
  if (preview?.active) {
    preview.stop();
    router.replace("/(tabs)/profile");
    return;
  }
  s.update({ onboarded: true });
  router.replace("/(tabs)");
  if (s.intent === "lost") router.push("/report/lost");
  else if (s.intent === "seen") router.push("/report/sighted");
  else if (s.intent === "register") router.push({ pathname: "/pet", params: { id: "new" } });
}
