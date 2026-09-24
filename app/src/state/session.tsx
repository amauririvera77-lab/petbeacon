import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Intent = "lost" | "seen" | "register" | "";

// alertRadiusMi: radio configurable en Profile (1-10 mi, CLAUDE.md §2), usado por reports_nearby (§5.4 y §6).
// home: centro del feed y del mapa (GPS del onboarding o ciudad geocodificada); null = aún sin resolver.
type Persisted = { onboarded: boolean; intent: Intent; name: string; city: string; alertRadiusMi: number; home: { lat: number; lng: number } | null; pushEnabled: boolean; emailEnabled: boolean; alertsCardDismissed: boolean; notifSeenAt: number };
type Session = Persisted & {
  hydrated: boolean;
  update: (patch: Partial<Persisted>) => void;
  reset: () => void; // vuelve al estado inicial (Log out): el onboarding se muestra de nuevo
};

const KEY = "petbeacon.session.v1";
const EMPTY: Persisted = { onboarded: false, intent: "", name: "", city: "", alertRadiusMi: 5, home: null, pushEnabled: true, emailEnabled: false, alertsCardDismissed: false, notifSeenAt: 0 };
const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setState({ ...EMPTY, ...JSON.parse(raw) }))
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const update = useCallback((patch: Partial<Persisted>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(EMPTY);
    AsyncStorage.removeItem(KEY).catch(() => {});
  }, []);

  const value = useMemo(() => ({ ...state, hydrated, update, reset }), [state, hydrated, update, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
