import { LatLng } from "./geo";

const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
const BASE = "https://api.mapbox.com/search/geocode/v6";

export type Place = { label: string; lat: number; lng: number; source?: "gps" | "manual" };

// Caja de ~25 mi alrededor del centro del usuario: sin ella, "Elm St & Maple Ave" resuelve a Illinois.
const D = 0.4;
const bboxAround = (c: LatLng) => `${c.lng - D},${c.lat - D},${c.lng + D},${c.lat + D}`;

type Feature = { geometry: { coordinates: [number, number] }; properties: { full_address?: string; name?: string; place_formatted?: string } };
const toPlace = (f: Feature): Place => ({
  label: f.properties.full_address || [f.properties.name, f.properties.place_formatted].filter(Boolean).join(", "),
  lng: f.geometry.coordinates[0],
  lat: f.geometry.coordinates[1],
});

// Devuelve candidatos; la UI deja que el usuario elija (la geocodificación de intersecciones es difusa).
export async function geocode(query: string, city: string | undefined, center: LatLng): Promise<Place[]> {
  if (!TOKEN) throw new Error("Mapbox token missing");
  const q = city && !query.toLowerCase().includes(city.split(",")[0].toLowerCase()) ? `${query}, ${city}` : query;
  const url = `${BASE}/forward?q=${encodeURIComponent(q)}&country=us&bbox=${bboxAround(center)}&proximity=${center.lng},${center.lat}&limit=5&access_token=${TOKEN}`;
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

// Resuelve la ciudad escrita en el registro a coordenadas (centro por defecto del feed si no hay GPS).
export async function geocodeCity(city: string): Promise<LatLng | null> {
  if (!TOKEN || !city.trim()) return null;
  try {
    const res = await fetch(`${BASE}/forward?q=${encodeURIComponent(city)}&country=us&types=place,postcode,locality&limit=1&access_token=${TOKEN}`);
    if (!res.ok) return null;
    const f = (await res.json()).features?.[0];
    return f ? { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } : null;
  } catch {
    return null;
  }
}
