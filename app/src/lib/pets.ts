import { ensureAccount, type ProfileInfo } from "./account";
import type { Pet, PetSize, Species } from "./database.types";
import { uploadPhoto } from "./photos";
import { supabase } from "./supabase";

export type PetInput = {
  name: string; species: Species; breed: string | null; breedId: string | null;
  color: string | null; size: PetSize | null; features: string | null; microchip: string | null;
  photoUri: string | null; photoUrl: string | null;
};

// Guarda (crea o edita) una mascota registrada. Crea la sesión anónima y el perfil si aún no existen.
// Con un Lost activo, la base copia los campos públicos que cambiaron a ese reporte y recalcula sus coincidencias (migración 0015/0017).
export async function savePet(id: string | null, input: PetInput, profile: ProfileInfo): Promise<Pet> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const uid = await ensureAccount(profile);
  const photo_url = input.photoUri ? await uploadPhoto(uid, input.photoUri) : input.photoUrl;
  const row = {
    name: input.name.trim(), species: input.species, breed: input.breed?.trim() || null, breed_id: input.breedId,
    color: input.color?.trim() || null, size: input.size, features: input.features?.trim() || null, microchip: input.microchip?.trim() || null, photo_url,
    // Foto nueva: sin punto focal propio todavía (centro por defecto) — igual que al cambiar la foto de un reporte (edit-report.tsx).
    ...(input.photoUri ? { photo_focus_x: null, photo_focus_y: null } : null),
  };
  const q = id
    ? supabase.from("pets").update(row).eq("id", id).select("*").single()
    : supabase.from("pets").insert({ ...row, user_id: uid }).select("*").single();
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as Pet;
}

// Retira una mascota sin borrarla (migración 0017): 'removed' = "Remove from my profile"; 'passed_away' cierra además su Lost activo sin alertas.
export async function archivePet(id: string, reason: "removed" | "passed_away"): Promise<void> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const { error } = await supabase.rpc("archive_pet", { p_pet: id, p_reason: reason });
  if (error) throw new Error(error.message);
}
