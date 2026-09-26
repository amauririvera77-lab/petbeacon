import type { LatLng } from "./geo";
import { supabase } from "./supabase";

export type ProfileInfo = { name: string; city: string; alertRadiusMi: number; home: LatLng | null };

// Sesión anónima de Supabase (Signup no pide contraseña) + fila de perfil. Se crea la primera vez que hace falta
// (publicar un reporte o activar las notificaciones) y se reutiliza después. Devuelve el id de usuario.
export async function ensureAccount(info: ProfileInfo): Promise<string> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const { data } = await supabase.auth.getSession();
  let uid = data.session?.user.id;
  if (!uid) {
    const { data: created, error } = await supabase.auth.signInAnonymously();
    if (error || !created.user) throw new Error(`Couldn't start a session (${error?.message ?? "unknown"}). Enable anonymous sign-ins in Supabase.`);
    uid = created.user.id;
  }
  // upsert solo con estas columnas: no pisa push_token, home ni las preferencias ya guardadas.
  const { error: pErr } = await supabase.from("profiles").upsert({
    id: uid, name: info.name || "Neighbor", city: info.city || "—", alert_radius_mi: info.alertRadiusMi,
  });
  if (pErr) throw new Error(`Couldn't save your profile: ${pErr.message}`);
  return uid;
}

// Actualiza la ciudad y el centro (home) en el perfil, si ya existe sesión. Sin sesión solo queda en el dispositivo.
export async function updateProfileLocation(city: string, home: LatLng | null): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const patch: { city: string; home?: string } = { city };
  if (home) patch.home = `SRID=4326;POINT(${home.lng} ${home.lat})`;
  const { error } = await supabase.from("profiles").update(patch).eq("id", data.session.user.id);
  if (error) console.warn("updateProfileLocation:", error.message);
}

// Cierra la sesión. OJO: la cuenta es anónima (sin contraseña), así que después NO hay forma de volver a ella.
// Antes se borra el token push del perfil para que este teléfono deje de recibir alertas de esa cuenta.
export async function logout(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    await supabase.from("profiles").update({ push_token: null }).eq("id", data.session.user.id);
  }
  await supabase.auth.signOut();
}

// Eliminar la cuenta (Profile → Delete account). Primero se borran las fotos del usuario del bucket con la API de Storage (SQL no puede
// hacerlo: borraría la fila y dejaría el archivo real); después delete_my_account() elimina reportes, mascotas, perfil y el usuario.
export async function deleteAccount(): Promise<void> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const { data: s } = await supabase.auth.getSession();
  const uid = s.session?.user.id;
  if (!uid) throw new Error("You're signed out.");

  const bucket = supabase.storage.from("report-photos");
  for (let guard = 0; guard < 50; guard++) {            // hasta 50 páginas de 1000 archivos
    const { data: files, error } = await bucket.list(uid, { limit: 1000 });
    if (error) throw new Error(`Couldn't list your photos: ${error.message}`);
    if (!files || files.length === 0) break;
    const { error: rmErr } = await bucket.remove(files.map((f) => `${uid}/${f.name}`));
    if (rmErr) throw new Error(`Couldn't delete your photos: ${rmErr.message}`);
    if (files.length < 1000) break;
  }
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw new Error(error.message);
  await supabase.auth.signOut().catch(() => {});
}
