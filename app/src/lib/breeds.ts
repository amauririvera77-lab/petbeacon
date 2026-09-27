import { BREEDS, type Breed } from "./breedList";
import type { PetSize, Species } from "./database.types";

// Razas canónicas (migración 0016). El id se guarda en pets.breed_id y reports.breed_id; el texto `breed` se conserva para mostrar.
// Especiales: "mixed" = "Mixed / Not sure" y "other" = texto libre como último recurso.
export const MIXED_ID = "mixed";
export const OTHER_ID = "other";
export const MIXED_LABEL = "Mixed / Not sure";

export type BreedValue = { id: string | null; text: string };
export const EMPTY_BREED: BreedValue = { id: null, text: "" };

// Misma normalización que norm_breed() en SQL: minúsculas, sin acentos y sin palabras vacías como "mix" o "dog".
export function normBreed(t: string | null | undefined): string {
  return (t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\b(mix|mixed|cross|crossbreed|mestizo|mestiza|puppy|dog|cat)\b/g, " ").replace(/\s+/g, " ").trim();
}
const words = (n: string, needle: string) => needle !== "" && new RegExp(`(^|[^a-z0-9])${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(n);

const byId = new Map(BREEDS.map((b) => [b.id, b]));
export const breedById = (id: string | null | undefined): Breed | undefined => (id ? byId.get(id) : undefined);
export const breedsFor = (species: Species | null): Breed[] => (species === "dog" || species === "cat" ? BREEDS.filter((b) => b.species === species) : []);

// Tamaño típico de una raza (evaluación UX, Pet profile 2.2): a partir de su peso de breed_sizes/breedList.ts. Sin peso (gatos, sin
// datos de tamaño hoy) o para "Mixed / Not sure" / "Other" devuelve null — el llamador no debe preseleccionar nada en ese caso.
export function sizeFromBreed(id: string | null): PetSize | null {
  if (!id || id === MIXED_ID || id === OTHER_ID) return null;
  const w = breedById(id)?.weightKg;
  if (w == null) return null;
  return w <= 11 ? "small" : w <= 27 ? "medium" : "large";
}

// Texto de raza antiguo → id (misma lógica que map_breed_or_mixed() en SQL). null = no se pudo mapear.
export function matchBreedText(text: string | null | undefined, species: Species | null): string | null {
  if (!text || !text.trim()) return null;
  const n = normBreed(text);
  if (!n || /^(unknown|unsure|not sure|mutt|no idea)$/.test(text.trim().toLowerCase())) return MIXED_ID;
  if (species !== "dog" && species !== "cat") return null;
  let best: { b: Breed; exact: boolean } | null = null;
  for (const b of breedsFor(species)) {
    const names = [normBreed(b.label), ...b.aliases.map(normBreed)];
    if (!names.some((x) => words(n, x))) continue;
    const exact = names.some((x) => x === n);
    if (!best || (exact && !best.exact) || (exact === best.exact && b.label.length > best.b.label.length)) best = { b, exact };
  }
  return best ? best.b.id : null;
}

// Lo que se muestra en el campo: la etiqueta de la raza elegida, el texto libre de "Other", o el texto antiguo si aún no tiene id.
export function breedDisplay(v: BreedValue): string {
  if (v.id === MIXED_ID) return MIXED_LABEL;
  if (v.id === OTHER_ID) return v.text;
  return breedById(v.id)?.label ?? v.text;
}

// Valor inicial a partir de lo guardado: si no hay id pero el texto se reconoce, se propone el id (sin cambiar el texto guardado).
export function breedValueFrom(id: string | null | undefined, text: string | null | undefined, species: Species | null): BreedValue {
  if (id) return { id, text: text ?? "" };
  const guess = matchBreedText(text, species);
  return { id: guess, text: text ?? "" };
}

// Búsqueda con autocompletado: por etiqueta o alias, sin acentos; primero los que empiezan por lo escrito.
export function searchBreeds(species: Species | null, query: string): Breed[] {
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
  const list = breedsFor(species);
  if (!q) return list;
  const strip = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const scored = list.map((b) => {
    const names = [b.label, ...b.aliases].map(strip);
    const starts = names.some((n) => n.startsWith(q));
    const has = names.some((n) => n.includes(q));
    return { b, s: starts ? 0 : has ? 1 : 2 };
  }).filter((x) => x.s < 2);
  return scored.sort((a, c) => a.s - c.s || a.b.label.localeCompare(c.b.label)).map((x) => x.b);
}
