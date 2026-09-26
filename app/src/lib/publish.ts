import type { LatLng } from "./geo";
import { ensureAccount } from "./account";
import { uploadPhoto } from "./photos";
import { registerPush } from "./push";
import { supabase } from "./supabase";
import type { ReportCondition, ReportStatus, Species } from "./database.types";

export type PublishInput = {
  status: Extract<ReportStatus, "lost" | "sighted">;
  species: Species;
  name: string | null;
  breed: string | null;
  features: string | null;
  condition?: ReportCondition | null; // solo avistamientos (columna propia desde 0012)
  contact: string | null;
  location: { lat: number; lng: number; label: string };
  photoUri: string | null; // foto local recién elegida (se sube)
  photoUrl?: string | null; // foto ya subida (p. ej. la de la mascota registrada): se reutiliza sin subirla otra vez
  petId?: string | null;
  profile: { name: string; city: string; alertRadiusMi: number; home: LatLng | null };
};

// petCreated: el Lost venía sin mascota registrada ("Another pet" desde el FAB) y se creó una a partir del reporte.
export type PublishResult = { id: string; petId: string | null; petCreated: boolean };

export async function publishReport(input: PublishInput): Promise<PublishResult> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const uid = await ensureAccount(input.profile);

  await registerPush(uid, input.profile.home); // best-effort: el perfil ya existe; guarda token y ubicación base del usuario

  const photo_url = input.photoUri ? await uploadPhoto(uid, input.photoUri) : (input.photoUrl ?? null);

  // Todo Lost va ligado a una mascota registrada (migración 0015): si no viene una, se registra aquí con los datos del reporte.
  let petId = input.petId ?? null;
  let petCreated = false;
  if (input.status === "lost" && !petId) {
    const { data: pet, error: petErr } = await supabase.from("pets").insert({
      user_id: uid, name: input.name?.trim() || `Unnamed ${input.species}`, species: input.species, breed: input.breed, photo_url,
    }).select("id").single();
    if (petErr) throw new Error(`Couldn't register your pet: ${petErr.message}`);
    petId = (pet as { id: string }).id;
    petCreated = true;
  }

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
      condition: input.condition ?? null,
      // PostGIS acepta EWKT como texto (lng primero).
      location: `SRID=4326;POINT(${input.location.lng} ${input.location.lat})`,
      location_label: input.location.label,
      contact_phone_or_email: input.contact,
      pet_id: petId,
    })
    .select("id")
    .single();
  if (error) {
    if (petCreated && petId) await supabase.from("pets").delete().eq("id", petId); // no dejar una mascota huérfana si el reporte falló
    // Una mascota solo puede tener un Lost activo: la base lo impone (índice único), también en llamadas directas.
    if (error.code === "23505" && /one_active_lost/.test(error.message)) throw new Error("This pet already has an active Lost report.");
    throw new Error(`Couldn't publish: ${error.message}`);
  }
  return { id: (data as { id: string }).id, petId, petCreated };
}
