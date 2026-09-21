import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Intent = "lost" | "seen" | "register" | "";

type Persisted = { onboarded: boolean; intent: Intent; name: string; city: string };
type Session = Persisted & {
  hydrated: boolean;
  update: (patch: Partial<Persisted>) => void;
};

const KEY = "petbeacon.session.v1";
const EMPTY: Persisted = { onboarded: false, intent: "", name: "", city: "" };
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

  const value = useMemo(() => ({ ...state, hydrated, update }), [state, hydrated, update]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession must be used inside SessionProvider");
  return v;
}
