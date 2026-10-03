// Sube las 6 fotos nuevas del seed de demostración (supabase/seed-assets/) al bucket de Storage `report-photos`,
// bajo la carpeta demo/, y borra del bucket la foto con marca de agua de Lazy (si el proyecto ya tiene una).
//
// Por qué un script aparte y no parte de seed_demo_reset.sql: Storage no es SQL — subir/borrar archivos del bucket
// requiere la service_role key (RLS de storage.objects solo permite subir a `authenticated` dentro de su propia
// carpeta <uid>/, ver 0003_contact_privacy_and_storage.sql). La service_role key nunca debe pegarse en .env ni
// compartirse: se pasa SOLO como variable de entorno al correr este script, una vez, desde tu máquina.
//
// CÓMO CORRERLO (más fácil, sin usar la Terminal para pegar la clave):
//   1. Abre (o crea) el archivo app/.service_role_key.local en un editor de texto (TextEdit, VS Code, Notas).
//   2. Pega ahí SOLO tu service_role key (Settings → API → pestaña "Legacy anon, service_role API keys"), nada más
//      en el archivo. Guarda. Ese archivo está en .gitignore — nunca se sube al repo.
//   3. En la Terminal, desde app/: node scripts/upload-seed-photos.mjs
//
// Alternativa (variable de entorno, si prefieres la Terminal):
//   SUPABASE_SERVICE_ROLE_KEY=<tu service_role key> node scripts/upload-seed-photos.mjs
//
// La URL del proyecto se lee de app/.env (EXPO_PUBLIC_SUPABASE_URL, es pública). Si falta, pásala también:
//   SUPABASE_URL=https://xxxx.supabase.co node scripts/upload-seed-photos.mjs
//
// QUÉ HACE
//   1. Sube supabase/seed-assets/*.jpg a report-photos/demo/*.jpg (upsert: se puede correr varias veces).
//   2. Busca tu mascota real "Lazy" (mismo criterio que seed_demo_reset.sql: el perfil no-demo creado más
//      recientemente) y, si su photo_url actual apunta a un archivo en report-photos (no a demo/ ni a un link
//      externo), lo borra del bucket — es la foto vieja con marca de agua de Adobe Stock. Con el service_role
//      key, esto puede leer/borrar objetos de storage.objects sin depender de las políticas de `authenticated`.
//   3. Imprime la URL pública de cada foto subida, para pegar en seed_demo_reset.sql (ya está hecho ahí, esto es
//      solo para verificar que coincide).
//
// No toca ninguna tabla ni ninguna fila: seed_demo_reset.sql y seed_edge_cases.sql son los que actualizan
// photo_url/color/size — sigue corriéndolos tú mismo en el SQL Editor, como siempre.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(here, "../../supabase/seed-assets");
const BUCKET = "report-photos";
const DEMO_OWNER = "00000000-0000-0000-0000-000000000001";
const DEMO_REPORTER = "00000000-0000-0000-0000-000000000002";

function readEnvUrl() {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  try {
    const envFile = readFileSync(path.resolve(here, "../.env"), "utf8");
    const m = envFile.match(/^EXPO_PUBLIC_SUPABASE_URL=(.+)$/m);
    if (m) return m[1].trim();
  } catch { /* no .env, se pedirá por variable de entorno */ }
  return null;
}

function readServiceKey() {
  // .trim() por si el copiar/pegar deja un salto de línea o espacio al final — eso rompe el JWT ("Invalid Compact JWS").
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  try {
    return readFileSync(path.resolve(here, "../.service_role_key.local"), "utf8").trim();
  } catch { return null; }
}

const SUPABASE_URL = readEnvUrl();
const SERVICE_KEY = readServiceKey();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Falta SUPABASE_URL (no se encontró en app/.env) o la service_role key.");
  console.error("Opción fácil: pega SOLO tu service_role key en app/.service_role_key.local (créalo si no existe) y vuelve a correr este script.");
  console.error("Opción Terminal: SUPABASE_SERVICE_ROLE_KEY=... node scripts/upload-seed-photos.mjs");
  process.exit(1);
}
if (!/^eyJ/.test(SERVICE_KEY)) {
  console.error(`La clave no parece una service_role key válida (debería empezar con "eyJ"; la que se leyó empieza con "${SERVICE_KEY.slice(0, 6)}").`);
  console.error("Ve a Supabase → Settings → API → pestaña \"Legacy anon, service_role API keys\" y copia la fila service_role.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function publicUrl(objectPath) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

async function uploadDemoPhotos() {
  const files = readdirSync(assetsDir).filter((f) => f.toLowerCase().endsWith(".jpg"));
  console.log(`Subiendo ${files.length} fotos de ${assetsDir} → ${BUCKET}/demo/ …`);
  for (const file of files) {
    const objectPath = `demo/${file}`;
    const bytes = readFileSync(path.join(assetsDir, file));
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) { console.error(`  ✗ ${file}: ${error.message}`); continue; }
    console.log(`  ✓ ${file} → ${publicUrl(objectPath)}`);
  }
}

async function deleteOldLazyPhoto() {
  const { data: profiles, error: pErr } = await supabase
    .from("profiles").select("id, created_at")
    .not("id", "in", `(${DEMO_OWNER},${DEMO_REPORTER})`)
    .order("created_at", { ascending: false }).limit(1);
  if (pErr) { console.error(`No pude buscar tu perfil real: ${pErr.message}`); return; }
  const me = profiles?.[0]?.id;
  if (!me) { console.log("Sin perfil real todavía (solo demo) — nada que borrar de Lazy."); return; }

  const { data: pet, error: petErr } = await supabase
    .from("pets").select("id, name, photo_url").eq("user_id", me).ilike("name", "lazy").maybeSingle();
  if (petErr) { console.error(`No pude buscar a Lazy: ${petErr.message}`); return; }
  if (!pet?.photo_url) { console.log("Lazy no tiene foto registrada todavía — nada que borrar."); return; }

  const prefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`;
  if (!pet.photo_url.startsWith(prefix)) {
    console.log(`La foto actual de Lazy no está en ${BUCKET} (¿link externo?) — no se borra nada del bucket: ${pet.photo_url}`);
    return;
  }
  const objectPath = pet.photo_url.slice(prefix.length);
  if (objectPath.startsWith("demo/")) {
    console.log("La foto actual de Lazy ya es una de las fotos de demo — no se borra.");
    return;
  }
  const { error: delErr } = await supabase.storage.from(BUCKET).remove([objectPath]);
  if (delErr) { console.error(`No pude borrar la foto vieja de Lazy (${objectPath}): ${delErr.message}`); return; }
  console.log(`✓ Borrada del bucket la foto vieja de Lazy (con marca de agua): ${objectPath}`);
}

await uploadDemoPhotos();
await deleteOldLazyPhoto();
console.log("\nListo. Ahora corre seed_demo_reset.sql y seed_edge_cases.sql en el SQL Editor de Supabase.");
