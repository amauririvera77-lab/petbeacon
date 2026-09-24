import { File } from "expo-file-system";
import { supabase } from "./supabase";

// Sube una foto local al bucket público `report-photos`, dentro de la carpeta del usuario (<uid>/…). Devuelve su URL pública.
export async function uploadPhoto(uid: string, uri: string): Promise<string> {
  if (!supabase) throw new Error("Supabase isn't configured.");
  const bytes = await new File(uri).arrayBuffer();
  const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from("report-photos").upload(path, bytes, { contentType: "image/jpeg" });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return supabase.storage.from("report-photos").getPublicUrl(path).data.publicUrl;
}
