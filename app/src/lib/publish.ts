import { File } from "expo-file-system";
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
  photoUri: string | null;
  profile: { name: string; city: string; alertRadiusMi: number };
};

// Sesión anónima (Signup no pide contraseña): se crea al primer publish y se reutiliza después.
async function ensureUser(): Promise<string> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: created, error } = await supabase.auth.signInAnonymously();
  if (error || !created.user) throw new Error(`Couldn't start a session (${error?.message ?? "unknown"}). Enable anonymous sign-ins in Supabase.`);
  return created.user.id;
}

async function uploadPhoto(uid: string, uri: string): Promise<string> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const bytes = await new File(uri).arrayBuffer();
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from("report-photos").upload(path, bytes, { contentType: "image/jpeg" });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return supabase.storage.from("report-photos").getPublicUrl(path).data.publicUrl;
}

export async function publishReport(input: PublishInput): Promise<{ id: string }> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const uid = await ensureUser();

  const { error: pErr } = await supabase.from("profiles").upsert({
    id: uid, name: input.profile.name || "Neighbor", city: input.profile.city || "—", alert_radius_mi: input.profile.alertRadiusMi,
  });
  if (pErr) throw new Error(`Couldn't save your profile: ${pErr.message}`);

  const photo_url = input.photoUri ? await uploadPhoto(uid, input.photoUri) : null;

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
    })
    .select("id")
    .single();
  if (error) throw new Error(`Couldn't publish: ${error.message}`);
  return { id: (data as { id: string }).id };
}
