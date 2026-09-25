-- 0009 · Reglas de coincidencia (matching) — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar.
--
-- Problema: el matching solo exigía misma especie y estar dentro del radio; la raza solo subía la confianza.
-- Resultado: "Possible match for Max" con un Beagle (Max es Golden Retriever). Esta migración exige, como mínimo:
--   1. Misma especie (sin excepciones).
--   2. Avistamiento POSTERIOR a la fecha en que se reportó la pérdida (sin excepciones).
--   3. Proximidad al último punto donde se vio la mascota, con un RADIO DE COINCIDENCIA PROPIO (independiente del radio de alertas
--      del dueño) que crece con el tiempo transcurrido desde la pérdida:  < 24 h → 3 mi · < 72 h → 5 mi · después → 10 mi.
--   4. Tamaño compatible, SOLO para perros y por peso típico de la raza (razón > 1.7 = incompatible). La raza por sí sola nunca descarta:
--      los avistadores no son expertos en razas. Perros de otra raza pero de tamaño similar, "mix" o raza desconocida → siguen siendo candidatos.
--      Gatos: una raza distinta NUNCA descarta; solo baja la confianza ('strong' → 'possible').
--   Solo una raza idéntica da 'strong'.
-- Cada coincidencia guarda POR QUÉ se generó (reasons) y a qué distancia (distance_mi).

-- ── 1. Normalización de raza ─────────────────────────────────────────────────────────────────────────────────────
create or replace function norm_breed(t text) returns text language sql immutable as $$
  select nullif(trim(regexp_replace(regexp_replace(
    translate(lower(coalesce(t, '')), 'áéíóúüñ', 'aeiouun'),
    '\m(mix|mixed|cross|crossbreed|mestizo|mestiza|puppy|dog|cat)\M', ' ', 'g'), '\s+', ' ', 'g')), '')
$$;

-- ── 2. Tamaños típicos (kg, adulto) por raza de perro ─────────────────────────────────────────────────────────────
-- `pattern` va normalizado (minúsculas, sin acentos). Gana el patrón más largo que esté contenido en la raza escrita.
create table if not exists breed_sizes (
  pattern text primary key,
  weight_kg numeric not null check (weight_kg > 0)
);
alter table breed_sizes enable row level security;
drop policy if exists "breed_sizes readable" on breed_sizes;
create policy "breed_sizes readable" on breed_sizes for select using (true);

insert into breed_sizes (pattern, weight_kg) values
  ('chihuahua', 2.5), ('yorkshire', 3), ('yorkie', 3), ('pomeranian', 3), ('maltese', 3), ('papillon', 4),
  ('miniature pinscher', 4), ('toy poodle', 3.5), ('pekingese', 5), ('pequines', 5), ('havanese', 5),
  ('bichon', 6), ('shih tzu', 6), ('lhasa apso', 6), ('cairn terrier', 6), ('rat terrier', 6),
  ('jack russell', 6.5), ('miniature schnauzer', 7), ('mini schnauzer', 7), ('miniature poodle', 7),
  ('cavalier', 7), ('pug', 8), ('boston terrier', 8), ('dachshund', 9), ('salchicha', 9),
  ('west highland', 9), ('westie', 9), ('scottish terrier', 9), ('shiba', 10), ('basenji', 10),
  ('beagle', 11), ('french bulldog', 12), ('corgi', 12), ('whippet', 12), ('cocker spaniel', 13),
  ('staffordshire', 15), ('brittany', 16), ('cattle dog', 18), ('blue heeler', 18), ('border collie', 19),
  ('poodle', 20), ('australian shepherd', 22), ('husky', 22), ('samoyed', 22), ('shar pei', 22),
  ('springer spaniel', 22), ('bulldog', 24), ('pit bull', 25), ('pitbull', 25), ('basset', 25),
  ('collie', 25), ('chow chow', 25), ('dalmatian', 25), ('airedale', 25), ('bull terrier', 25),
  ('standard poodle', 25), ('pointer', 25), ('hound', 25), ('setter', 28), ('malinois', 28),
  ('labrador', 30), ('lab', 30), ('golden retriever', 30), ('retriever', 30), ('boxer', 30),
  ('greyhound', 30), ('weimaraner', 32), ('vizsla', 27), ('german shepherd', 34), ('pastor aleman', 34),
  ('shepherd', 30), ('doberman', 36), ('akita', 38), ('malamute', 38), ('bloodhound', 40),
  ('bernese', 42), ('rottweiler', 45), ('cane corso', 45), ('great pyrenees', 45), ('great dane', 60),
  ('newfoundland', 60), ('saint bernard', 70), ('mastiff', 75)
on conflict (pattern) do update set weight_kg = excluded.weight_kg;

create or replace function breed_pattern(t text) returns text language sql stable as $$
  select pattern from breed_sizes where norm_breed(t) like '%' || pattern || '%' order by length(pattern) desc limit 1
$$;

-- ── 3. Compatibilidad de raza ──────────────────────────────────────────────────────────────────────────────────────
-- 'exact'        misma raza (solo esta da 'strong')
-- 'similar'      perros de raza distinta pero peso compatible
-- 'different'    gatos con razas específicas distintas (NO descarta; baja la confianza)
-- 'unknown'      falta un dato o la raza es genérica ("domestic", "mix", desconocida) (NO descarta)
-- 'incompatible' SOLO perros con pesos típicos muy distintos (razón > 1.7): es el único caso que descarta
create or replace function breed_compat(a text, b text, sp species_type) returns text
language plpgsql stable as $$
declare
  na text := norm_breed(a); nb text := norm_breed(b);
  pa text; pb text; wa numeric; wb numeric;
  generic text := '(domestic|shorthair|longhair|unknown|unsure)';
begin
  if na is null or nb is null then return 'unknown'; end if;

  if sp = 'dog' then
    pa := breed_pattern(a); pb := breed_pattern(b);
    if pa is null or pb is null then return case when na = nb then 'exact' else 'unknown' end; end if;
    if pa = pb then return 'exact'; end if;
    select weight_kg into wa from breed_sizes where pattern = pa;
    select weight_kg into wb from breed_sizes where pattern = pb;
    return case when greatest(wa, wb) / least(wa, wb) <= 1.7 then 'similar' else 'incompatible' end;
  elsif sp = 'cat' then
    if na = nb then return 'exact'; end if;
    if na ~ generic or nb ~ generic then return 'unknown'; end if;
    return 'different';
  end if;
  return 'unknown';
end $$;

-- Radio de coincidencia (mi) según el tiempo transcurrido entre la pérdida y el avistamiento. Independiente del radio de alertas.
create or replace function match_radius_mi(elapsed interval) returns numeric language sql immutable as $$
  select case when elapsed < interval '24 hours' then 3
              when elapsed < interval '72 hours' then 5
              else 10 end::numeric
$$;

-- ── 4. Motivos y distancia guardados en cada coincidencia ─────────────────────────────────────────────────────────
alter table matches add column if not exists distance_mi numeric(6, 2);
alter table matches add column if not exists reasons jsonb;

-- ── 5. Trigger de matching con las reglas nuevas ──────────────────────────────────────────────────────────────────
create or replace function match_new_sighting() returns trigger language plpgsql security definer as $$
begin
  if new.status <> 'sighted' then return new; end if;
  insert into matches (lost_report_id, sighted_report_id, confidence, distance_mi, reasons)
  select l.id, new.id,
         case when c.k = 'exact' then 'strong'::match_confidence else 'possible'::match_confidence end,
         round(d.miles::numeric, 2),
         jsonb_build_object(
           'same_species', true,
           'breed', c.k,                                   -- exact | similar | different | unknown
           'distance_mi', round(d.miles::numeric, 2),
           'radius_mi', match_radius_mi(new.created_at - l.created_at),
           'seen_after_loss', true,
           'minutes_after_loss', round((extract(epoch from (new.created_at - l.created_at)) / 60)::numeric),
           'passes_rules', true
         )
  from reports l
  cross join lateral (select st_distance(l.location, new.location) / 1609.344 as miles) d
  cross join lateral (select breed_compat(l.breed, new.breed, l.species) as k) c
  where l.status = 'lost'
    and l.user_id <> new.user_id
    and l.species = new.species                                            -- 1. misma especie
    and new.created_at >= l.created_at                                     -- 2. avistamiento posterior a la pérdida
    and d.miles <= match_radius_mi(new.created_at - l.created_at)          -- 3. radio propio, crece con el tiempo
    and c.k <> 'incompatible'                                              -- 4. solo el tamaño (perros) descarta
  on conflict do nothing;
  return new;
end $$;

-- ── 6. Limpieza de datos existentes ───────────────────────────────────────────────────────────────────────────────
-- Se BORRAN únicamente las coincidencias que incumplen la especie o la fecha, y solo si no fueron descartadas por el usuario.
-- Nunca se borra una coincidencia `dismissed`, ni las que solo fallan por raza/tamaño o por radio: esas se recalculan.
delete from matches m
using reports l, reports s
where m.lost_report_id = l.id and m.sighted_report_id = s.id
  and not m.dismissed
  and (l.species <> s.species or s.created_at < l.created_at);

-- Recalcula distancia, confianza y motivos de TODAS las que quedan con las reglas nuevas. `passes_rules` marca si aún cumplen
-- todas las reglas; my_matches() (abajo) oculta —sin borrar— las que no (p. ej. una coincidencia descartada de otra especie).
update matches m set
  distance_mi = round((st_distance(l.location, s.location) / 1609.344)::numeric, 2),
  confidence = case when breed_compat(l.breed, s.breed, l.species) = 'exact' then 'strong'::match_confidence else 'possible'::match_confidence end,
  reasons = jsonb_build_object(
    'same_species', l.species = s.species,
    'breed', breed_compat(l.breed, s.breed, l.species),
    'distance_mi', round((st_distance(l.location, s.location) / 1609.344)::numeric, 2),
    'radius_mi', match_radius_mi(s.created_at - l.created_at),
    'seen_after_loss', s.created_at >= l.created_at,
    'minutes_after_loss', round((extract(epoch from (s.created_at - l.created_at)) / 60)::numeric),
    'passes_rules', (l.species = s.species
                     and s.created_at >= l.created_at
                     and st_distance(l.location, s.location) / 1609.344 <= match_radius_mi(s.created_at - l.created_at)
                     and breed_compat(l.breed, s.breed, l.species) <> 'incompatible'))
from reports l, reports s
where m.lost_report_id = l.id and m.sighted_report_id = s.id;

-- ── 7. my_matches(): ahora devuelve también cuándo se vio, la especie, la distancia y los motivos ────────────────────
drop function if exists my_matches();
create function my_matches()
returns table (
  id uuid, lost_report_id uuid, lost_name text, sighted_report_id uuid, confidence match_confidence,
  dismissed boolean, created_at timestamptz, sighted_created_at timestamptz, sighted_species species_type,
  sighted_photo_url text, sighted_label text, sighted_breed text,
  sighted_focus_x smallint, sighted_focus_y smallint, sighted_zoom smallint,
  distance_mi numeric, reasons jsonb
)
language sql stable as $$
  select m.id, m.lost_report_id, l.name, m.sighted_report_id, m.confidence, m.dismissed, m.created_at,
         s.created_at, s.species, s.photo_url, s.location_label, s.breed,
         s.photo_focus_x, s.photo_focus_y, s.photo_zoom, m.distance_mi, m.reasons
  from matches m
  join reports l on l.id = m.lost_report_id
  join reports s on s.id = m.sighted_report_id
  where l.user_id = auth.uid() and l.status = 'lost' and s.status = 'sighted'
    and s.created_at > now() - interval '48 hours'
    and coalesce((m.reasons->>'passes_rules')::boolean, true)   -- las que ya no cumplen las reglas quedan ocultas, no borradas
  order by m.created_at desc;
$$;
grant execute on function my_matches() to authenticated;

-- ── 8. DATOS DE PRUEBA (solo demo) ────────────────────────────────────────────────────────────────────────────────────
-- Ejemplo coherente: un Golden Retriever visto hace 30 min a ~0.2 mi de donde se perdió Max → 'strong' para Max.
-- (Con las reglas nuevas: el Beagle #2 no genera match con Max —tamaños incompatibles—; el gato #3 sí genera un 'possible' para Luna,
--  porque una raza de gato distinta solo baja la confianza.)
insert into reports (id, user_id, status, species, name, breed, photo_url, features_description, location, location_label, created_at)
select '10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'sighted', 'dog', null, 'Golden Retriever', null,
       'Golden coat, blue collar. Stayed near the park entrance and let people approach.',
       st_makepoint(-73.77050, 41.03850)::geography, 'Maple Park entrance', now() - interval '30 minutes'
where exists (select 1 from profiles where id = '00000000-0000-0000-0000-000000000002')
on conflict (id) do nothing;
