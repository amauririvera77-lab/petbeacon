import type { LatLng } from "./geo";
import { ensureAccount } from "./account";
import { uploadPhoto } from "./photos";
import { registerPush } from "./push";
import { supabase } from "./supabase";
import type { ReportStatus, Species } from "./database.types";

export type PublishInput = {
  status: Extract<ReportStatus, "lost" | "sighted">;
  species: Species;
  name: string | null;
  breed: string | null;
  features: string | null;
  contact: string | null;
  location: { lat: number; lng: number; label: string };
  photoUri: string | null; // foto local recién elegida (se sube)
  photoUrl?: string | null; // foto ya subida (p. ej. la de la mascota registrada): se reutiliza sin subirla otra vez
  petId?: string | null;
  profile: { name: string; city: string; alertRadiusMi: number; home: LatLng | null };
};

export async function publishReport(input: PublishInput): Promise<{ id: string }> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const uid = await ensureAccount(input.profile);

  await registerPush(uid, input.profile.home); // best-effort: el perfil ya existe; guarda token y ubicación base del usuario

  const photo_url = input.photoUri ? await uploadPhoto(uid, input.photoUri) : (input.photoUrl ?? null);

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: uid,
      status: input.status,
      species: input.species,
      name: input.name,
      breed: input.breed,
      photo_url,
      features_description: input.features,
      // PostGIS acepta EWKT como texto (lng primero).
      location: `SRID=4326;POINT(${input.location.lng} ${input.location.lat})`,
      location_label: input.location.label,
      contact_phone_or_email: input.contact,
      pet_id: input.petId ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't publish: ${error.message}`);
  return { id: (data as { id: string }).id };
}
