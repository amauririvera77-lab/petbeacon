import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SortMode } from "../lib/sort";

// Preferencias de la Home que deben sobrevivir al cambiar entre List y Map y al volver a la pantalla (y entre sesiones).
// Vive fuera de la pantalla para no perderse; fases siguientes añaden aquí búsqueda y filtros.
type Prefs = { sort: SortMode };
const KEY = "petbeacon.homePrefs.v1";
const DEFAULT: Prefs = { sort: "recent" };
const Ctx = createContext<{ prefs: Prefs; setSort: (s: SortMode) => void } | null>(null);

export function HomePrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => raw && setPrefs({ ...DEFAULT, ...JSON.parse(raw) })).catch(() => {});
  }, []);
  const setSort = useCallback((sort: SortMode) => {
    setPrefs((p) => { const next = { ...p, sort }; AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {}); return next; });
  }, []);
  const value = useMemo(() => ({ prefs, setSort }), [prefs, setSort]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHomePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHomePrefs must be used inside HomePrefsProvider");
  return v;
}
