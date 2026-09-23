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
