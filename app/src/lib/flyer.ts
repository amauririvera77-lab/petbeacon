import type { Report } from "./database.types";
import { supabase } from "./supabase";

// URL pública de la página web (carpeta web/). El QR del flyer apunta a <base>/r/<id>. Sin base no hay QR.
export const WEB_BASE = (process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "").trim().replace(/\/+$/, "");
// El flyer aún no está verificado de punta a punta (falta desplegar la web y probar la captura en el iPhone): mientras sea false
// se oculta en el modo dueño de la hoja de detalle. Cambiar a true cuando funcione.
export const FLYERS_READY = false;

export const reportUrl = (id: string): string | null => (WEB_BASE ? `${WEB_BASE}/r/${id}` : null);

export type FlyerReport = Pick<Report, "id" | "status" | "species" | "name" | "breed" | "photo_url" | "photo_focus_x" | "photo_focus_y" | "features_description" | "location_label" | "created_at">;
const COLS = "id,status,species,name,breed,photo_url,photo_focus_x,photo_focus_y,features_description,location_label,created_at";

// El flyer se puebla con datos reales del reporte (CLAUDE.md §5.7). El teléfono/email sale de my_report_contact():
// devuelve el contacto SOLO si quien llama es el dueño; para cualquier otra persona (o sin sesión) es null,
// así el flyer de un reporte ajeno nunca lleva teléfono aunque alguien lo intente.
export async function loadFlyerData(id: string): Promise<{ report: FlyerReport; contact: string | null }> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const { data, error } = await supabase.from("reports").select(COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("We couldn't find this report.");
  const { data: contact, error: cErr } = await supabase.rpc("my_report_contact", { report_id: id });
  return { report: data as FlyerReport, contact: cErr ? null : (contact as string | null) };
}
