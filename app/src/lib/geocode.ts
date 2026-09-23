import { DEFAULT_CENTER } from "./geo";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const BASE = "https://api.mapbox.com/search/geocode/v6";

export type Place = { label: string; lat: number; lng: number };

// Caja de ~25 mi alrededor del centro: sin ella, "Elm St & Maple Ave" resuelve a Illinois.
const D = 0.4;
const BBOX = `${DEFAULT_CENTER.lng - D},${DEFAULT_CENTER.lat - D},${DEFAULT_CENTER.lng + D},${DEFAULT_CENTER.lat + D}`;

type Feature = { geometry: { coordinates: [number, number] }; properties: { full_address?: string; name?: string; place_formatted?: string } };
const toPlace = (f: Feature): Place => ({
  label: f.properties.full_address || [f.properties.name, f.properties.place_formatted].filter(Boolean).join(", "),
  lng: f.geometry.coordinates[0],
  lat: f.geometry.coordinates[1],
});

// Devuelve candidatos; la UI deja que el usuario elija (la geocodificación de intersecciones es difusa).
export async function geocode(query: string, city?: string): Promise<Place[]> {
  if (!TOKEN) throw new Error("Mapbox token missing");
  const q = city && !query.toLowerCase().includes(city.split(",")[0].toLowerCase()) ? `${query}, ${city}` : query;
  const url = `${BASE}/forward?q=${encodeURIComponent(q)}&country=us&bbox=${BBOX}&proximity=${DEFAULT_CENTER.lng},${DEFAULT_CENTER.lat}&limit=5&access_token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = await res.json();
  return (data.features ?? []).map(toPlace);
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`${BASE}/reverse?longitude=${lng}&latitude=${lat}&limit=1&access_token=${TOKEN}`);
    if (!res.ok) return null;
    const f = (await res.json()).features?.[0];
    return f ? toPlace(f).label : null;
  } catch {
    return null;
  }
}
