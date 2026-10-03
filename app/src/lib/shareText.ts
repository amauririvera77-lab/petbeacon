import { breedLabel } from "./breeds";
import type { ReportStatus, Species } from "./database.types";
import { reportUrl } from "./flyer";
import { shortAddress } from "./address";
import { whenLabel } from "./time";

type Shareable = {
  id: string; status: ReportStatus; species: Species; name: string | null; breed: string | null; breed_id?: string | null;
  features_description: string | null; location_label: string | null; created_at: string;
};

// Texto para compartir un reporte por la hoja nativa. Incluye el enlace público cuando está configurado y NUNCA el contacto del dueño.
export function reportShareText(r: Shareable): string {
  const title = r.name?.trim() || `Unknown ${r.species}`;
  const breed = breedLabel(r.breed, r.breed_id);
  const seen = `${whenLabel(r.created_at)}${r.location_label ? ` · ${shortAddress(r.location_label)}` : ""}`;
  const link = reportUrl(r.id);
  const tail = `${link ? `\n${link}` : ""}\nReported via PetBeacon`;
  return r.status === "lost"
    ? `MISSING ${r.species}: ${title}${breed ? ` (${breed})` : ""}. Last seen ${seen}. ${r.features_description ?? ""}${tail}`
    : `Have you seen this pet? A ${breed ?? r.species} was spotted ${seen}. ${r.features_description ?? ""}${tail}`;
}
