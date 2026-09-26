import type { ReportStatus, Species } from "./database.types";

type Titled = { status: ReportStatus; species: Species; name: string | null; breed: string | null; features_description: string | null };
const SPECIES_TITLE: Record<Species, string> = { dog: "Dog", cat: "Cat", other: "Pet" };

// Quita el prefijo "Condition: Scared." de datos anteriores a la migración 0012 (la condición ahora vive en su propia columna y NUNCA
// se muestra en las tarjetas; solo en el detalle).
export function cleanFeatures(t: string | null | undefined): string | null {
  const s = (t ?? "").replace(/^\s*Condition:\s*(Calm|Scared|Injured|Not sure)\.?\s*/i, "").trim();
  return s || null;
}

// Título de tarjeta (D.1). Avistamiento: la raza/tipo ("Golden Retriever", "Beagle mix") o, sin raza, la especie ("Dog" / "Cat"); el badge
// "Sighted" ya dice que no tiene dueño identificado. Lost y Reunited: el nombre de la mascota.
export function reportTitle(r: Titled): string {
  if (r.status === "sighted") return r.breed?.trim() || SPECIES_TITLE[r.species];
  return r.name?.trim() || `Unknown ${SPECIES_TITLE[r.species].toLowerCase()}`;
}

// Segunda línea (D.1/D.2): Lost y Reunited → la raza (o, sin raza, los rasgos); Sighted → los rasgos distintivos si existen (la raza ya es el
// título). Si no hay nada, se omite. Nunca la condición.
export function reportSubtitle(r: Titled): string | null {
  const feat = cleanFeatures(r.features_description);
  if (r.status === "sighted") return feat;
  return r.breed?.trim() || feat;
}
