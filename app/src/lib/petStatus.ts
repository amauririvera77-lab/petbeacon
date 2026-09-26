import type { Pet, Report } from "./database.types";

const DAY = 24 * 3_600_000;

type ReportLike = Pick<Report, "id" | "status" | "pet_id" | "created_at" | "reunited_at">;

// Estado de una mascota, DERIVADO de sus reportes (no se guarda):
//   "lost"     → tiene un reporte Lost activo
//   "reunited" → su último reporte se cerró con reencuentro hace menos de 24 h (la misma retención del feed)
//   "home"     → cualquier otro caso (y vuelve a "home" pasadas esas 24 h)
export type PetState = { state: "home" } | { state: "lost"; report: ReportLike } | { state: "reunited"; report: ReportLike };

export function petState(petId: string, reports: ReportLike[], now = Date.now()): PetState {
  const own = reports.filter((r) => r.pet_id === petId);
  const lost = own.filter((r) => r.status === "lost").sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
  if (lost) return { state: "lost", report: lost };
  const reunited = own
    .filter((r) => r.status === "reunited" && r.reunited_at && now - Date.parse(r.reunited_at) < DAY)
    .sort((a, b) => Date.parse(b.reunited_at!) - Date.parse(a.reunited_at!))[0];
  return reunited ? { state: "reunited", report: reunited } : { state: "home" };
}

export const petsAtHome = (pets: Pet[], reports: ReportLike[], now = Date.now()) => pets.filter((p) => petState(p.id, reports, now).state === "home");
