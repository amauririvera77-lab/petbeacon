// Centro por defecto del feed y del mapa (White Plains, NY — donde está el seed).
// Solo es el respaldo: el centro real sale de useHome() (GPS o ciudad del usuario).
export type LatLng = { lat: number; lng: number };
export const DEFAULT_CENTER: LatLng = { lat: 41.034, lng: -73.7629 };
