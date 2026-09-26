import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SortMode } from "../lib/sort";

export type AgeFilter = "24h" | "7d" | "all";
export type SpeciesFilter = "all" | "dog" | "cat" | "other";
export type ViewRadius = 1 | 5 | 10;
export type HomeView = "list" | "map";

// Preferencias de la Home. Viven FUERA de la pantalla para que no se pierdan al cambiar entre List y Map ni al volver a la Home
// (y se guardan en disco). `viewRadiusMi` es el radio de VISUALIZACIÓN del feed y del mapa: es independiente del radio de alertas
// del perfil, así que hojear no cambia en silencio dónde te notifican.
export type Prefs = {
  sort: SortMode;
  lost: boolean; // chips de estado (ambos activos por defecto)
  sighted: boolean;
  species: SpeciesFilter;
  viewRadiusMi: ViewRadius;
  age: AgeFilter;
  showReunited: boolean;
};
export const DEFAULT_PREFS: Prefs = { sort: "recent", lost: true, sighted: true, species: "all", viewRadiusMi: 5, age: "all", showReunited: false };

const KEY = "petbeacon.homePrefs.v2";
type Value = {
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  setSort: (s: SortMode) => void;
  // Filtros de la hoja (especie, antigüedad, "Show reunited"). NO toca el radio (no cuenta como filtro) ni los chips Lost/Sighted ni el orden.
  resetFilters: () => void;
  resetAll: () => void; // además reactiva los chips Lost y Sighted (para los estados vacíos)
  // Búsqueda: en List filtra por raza, color o nombre; en Map es una dirección/zona. Cada modo conserva su propio texto.
  listQuery: string; setListQuery: (q: string) => void;
  mapQuery: string; setMapQuery: (q: string) => void;
  // Modo de la Home (List/Map). Vive aquí, fuera de la pantalla, para que otras pantallas (p. ej. "View on List" al terminar un reporte) puedan fijarlo.
  view: HomeView; setView: (v: HomeView) => void;
};
const Ctx = createContext<Value | null>(null);

export function HomePrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(DEFAULT_PREFS);
  const [listQuery, setListQuery] = useState("");
  const [mapQuery, setMapQuery] = useState("");
  const [view, setView] = useState<HomeView>("list");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => raw && setPrefsState({ ...DEFAULT_PREFS, ...JSON.parse(raw) })).catch(() => {});
  }, []);

  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((p) => { const next = { ...p, ...patch }; AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {}); return next; });
  }, []);
  const setSort = useCallback((sort: SortMode) => setPrefs({ sort }), [setPrefs]);
  const resetFilters = useCallback(() => setPrefs({ species: "all", age: "all", showReunited: false }), [setPrefs]);
  const resetAll = useCallback(() => setPrefs({ lost: true, sighted: true, species: "all", age: "all", showReunited: false }), [setPrefs]);

  const value = useMemo(() => ({ prefs, setPrefs, setSort, resetFilters, resetAll, listQuery, setListQuery, mapQuery, setMapQuery, view, setView }),
    [prefs, setPrefs, setSort, resetFilters, resetAll, listQuery, mapQuery, view]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHomePrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHomePrefs must be used inside HomePrefsProvider");
  return v;
}
