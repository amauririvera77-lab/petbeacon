import { router } from "expo-router";
import { useSession } from "../state/session";

type S = ReturnType<typeof useSession>;

// Cierra el onboarding. Si la intención fue reportar, abre el flujo correspondiente (no el feed vacío).
export function finishOnboarding(s: S) {
  s.update({ onboarded: true });
  router.replace("/(tabs)");
  if (s.intent === "lost") router.push("/report/lost");
  else if (s.intent === "seen") router.push("/report/sighted");
  else if (s.intent === "register") router.push({ pathname: "/pet", params: { id: "new" } });
}
