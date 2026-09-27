import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import type { Persisted, Session } from "./session"; // solo tipos: no crea un ciclo en tiempo de ejecución con session.tsx

// ⚠️ HERRAMIENTA DE DISEÑO — quitar o desactivar antes de publicar (junto con Profile → "Design tools" y EXPO_PUBLIC_SHOW_DESIGN_TOOLS).
//
// "Replay onboarding" (Profile → Design tools): deja recorrer el onboarding completo para revisar el diseño SIN afectar la cuenta real.
// Mientras `active` es true, useSession() (en session.tsx) devuelve esta sesión aislada en memoria en lugar de la real: los "Skip" y
// pantallas de permisos leen y escriben aquí, nunca en AsyncStorage ni en Supabase. Arranca siempre vacía (como la vería alguien nuevo).
const EMPTY: Persisted = {
  onboarded: false, intent: "", name: "", city: "", alertRadiusMi: 5, home: null,
  pushEnabled: true, nearbyEnabled: true, matchEnabled: true, emailEnabled: false,
  alertsCardDismissed: false, notifSeenAt: 0, avatarUrl: null,
};

type PreviewCtxValue = { active: boolean; session: Session; start: () => void; stop: () => void };
const noopSession: Session = { ...EMPTY, hydrated: true, update: () => {}, reset: () => {} };
// Valor por defecto (sin Provider) = como si la vista previa no existiera: seguro para cualquier pantalla que llame a useSession()
// fuera del árbol del onboarding, aunque en la práctica el Provider siempre está montado en la raíz de la app.
const Ctx = createContext<PreviewCtxValue>({ active: false, session: noopSession, start: () => {}, stop: () => {} });

export function OnboardingPreviewProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [state, setState] = useState<Persisted>(EMPTY);
  const update = useCallback((patch: Partial<Persisted>) => setState((p) => ({ ...p, ...patch })), []);
  const reset = useCallback(() => setState(EMPTY), []);
  // Al empezar SIEMPRE se reinicia a vacío: dos vistas previas seguidas no arrastran nada de la anterior.
  const start = useCallback(() => { setState(EMPTY); setActive(true); }, []);
  const stop = useCallback(() => setActive(false), []);
  const session = useMemo<Session>(() => ({ ...state, hydrated: true, update, reset }), [state, update, reset]);
  const value = useMemo(() => ({ active, session, start, stop }), [active, session, start, stop]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboardingPreview() {
  return useContext(Ctx);
}
