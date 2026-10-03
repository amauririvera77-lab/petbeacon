import type { MyReport } from "../hooks/useMyReports";
import { activityMs } from "./activity";
import { distanceMi, parsePointHex } from "./geohex";
import type { LatLng } from "./geo";
import type { ReportNearby, SightingResolution } from "./database.types";

const DAY = 24 * 3_600_000;
const SIGHTING_LIFE = 48 * 3_600_000; // retención de un avistamiento en el feed (desde su última actividad)

// Un reporte propio con la forma del feed (para reutilizar ReportCard y el detalle): con su distancia a tu zona, calculada desde la ubicación guardada.
export function toNearby(r: MyReport, center: LatLng): ReportNearby | null {
  if (r.status !== "lost" && r.status !== "sighted" && r.status !== "reunited") return null;
  const p = parsePointHex(r.location);
  return {
    id: r.id, status: r.status, species: r.species, name: r.name, breed: r.breed, breed_id: r.breed_id, photo_url: r.photo_url,
    photo_focus_x: r.photo_focus_x, photo_focus_y: r.photo_focus_y, photo_zoom: r.photo_zoom,
    features_description: r.features_description, condition: r.condition ?? null, color: r.color ?? null, size: r.size ?? null,
    location_label: r.location_label, created_at: r.created_at, last_seen_at: r.last_seen_at ?? null,
    lat: p?.lat ?? center.lat, lng: p?.lng ?? center.lng, distance_mi: p ? distanceMi(center, p) : 0,
  };
}

export type ReportBuckets = { lost: MyReport[]; reunitedRecent: MyReport[]; sightings: MyReport[]; past: MyReport[] };

// Reparte los reportes propios: activos (Lost, reunidos hace <24 h, avistamientos vigentes) e historial (reunidos hace más de 24 h, resueltos,
// cerrados y avistamientos que ya no se muestran por antigüedad).
export function bucketReports(reports: MyReport[], now = Date.now()): ReportBuckets {
  const b: ReportBuckets = { lost: [], reunitedRecent: [], sightings: [], past: [] };
  for (const r of reports) {
    if (r.status === "lost") b.lost.push(r);
    else if (r.status === "reunited") (r.reunited_at && now - Date.parse(r.reunited_at) < DAY ? b.reunitedRecent : b.past).push(r);
    else if (r.status === "sighted") (now - activityMs(r) <= SIGHTING_LIFE ? b.sightings : b.past).push(r);
    else b.past.push(r); // closed, resolved
  }
  b.sightings.sort((a, c) => activityMs(c) - activityMs(a));
  b.past.sort((a, c) => pastDate(c, now) - pastDate(a, now));
  return b;
}

export const RESOLUTION_LABEL: Record<SightingResolution, string> = {
  returned_to_owner: "Returned to owner", no_longer_there: "No longer there", taken_to_shelter_or_vet: "Taken to a shelter or vet",
};

export function pastResult(r: MyReport): string {
  if (r.status === "reunited") return "Reunited";
  if (r.status === "resolved") return r.resolution ? RESOLUTION_LABEL[r.resolution] : "Resolved";
  if (r.status === "closed") return "Closed";
  return "Expired";
}
// Fecha del cierre: cuándo se reunió / resolvió; en un avistamiento vencido, cuándo dejó de mostrarse. Un Lost cerrado no guarda su fecha: se usa la de creación.
export function pastDate(r: MyReport, _now = Date.now()): number {
  if (r.status === "reunited" && r.reunited_at) return Date.parse(r.reunited_at);
  if (r.status === "resolved" && r.resolved_at) return Date.parse(r.resolved_at);
  if (r.status === "sighted") return activityMs(r) + SIGHTING_LIFE;
  return Date.parse(r.created_at);
}
