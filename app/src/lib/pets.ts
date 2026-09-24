import { ensureAccount, type ProfileInfo } from "./account";
import type { Pet, Species } from "./database.types";
import { uploadPhoto } from "./photos";
import { supabase } from "./supabase";

export type PetInput = { name: string; species: Species; breed: string | null; photoUri: string | null; photoUrl: string | null };

// Guarda (crea o edita) una mascota registrada. Crea la sesión anónima y el perfil si aún no existen.
export async function savePet(id: string | null, input: PetInput, profile: ProfileInfo): Promise<Pet> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const uid = await ensureAccount(profile);
  const photo_url = input.photoUri ? await uploadPhoto(uid, input.photoUri) : input.photoUrl;
  const row = { name: input.name.trim(), species: input.species, breed: input.breed?.trim() || null, photo_url };
  const q = id
    ? supabase.from("pets").update(row).eq("id", id).select("*").single()
    : supabase.from("pets").insert({ ...row, user_id: uid }).select("*").single();
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data as Pet;
}

export async function removePet(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const { error } = await supabase.from("pets").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
