-- 0016 · Razas canónicas — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar. Requiere 0014 y 0015.
--
-- Problema (Pet profile 2.1): la raza es texto libre. "Pequines", "Pequinés" y "Pekingese" son la misma raza, pero el matching no lo sabe:
-- solo compara textos y patrones, así que una raza idéntica escrita distinto nunca puede dar 'strong'.
--
-- Qué hace:
--  1. Tabla `breeds` (id canónico, especie, etiqueta, peso típico en kg y alias) con las razas de `breed_sizes` para perros más una lista
--     equivalente para gatos. Más dos opciones especiales: 'mixed' ("Mixed / Not sure") y 'other' (texto libre como último recurso).
--     Es de lectura pública (son datos de referencia) y la misma lista vive en la app (lib/breedList.ts).
--  2. `pets.breed_id` y `reports.breed_id` (el texto `breed` se conserva para mostrar y para "Other").
--  3. Migra los valores existentes: se asigna el id canónico cuando el texto coincide con una raza o un alias ("Pequines" → pekingese,
--     "Labrador mix" → labrador-retriever, "Domestic shorthair, gray tabby" → domestic-shorthair). Si el texto es una sinónimo puro se
--     reemplaza por la etiqueta canónica; si lleva más información ("Beagle mix") se conserva el texto. Al final hay una consulta con
--     los valores que NO se pudieron mapear.
--  4. El matching pasa a comparar por id (`breed_compat_v2`). Con "Mixed / Not sure" o sin id se usa la comparación por texto de siempre.
--     Se recrean match_new_sighting() y recompute_matches_for_lost() para usarlo, y el trigger que sincroniza mascota → reporte activo
--     copia también breed_id.
-- Es re-ejecutable.

-- ── 1. Tabla de razas ─────────────────────────────────────────────────────────────────────────────────────────────────
create table if not exists breeds (
  id text primary key,
  species species_type,                       -- null = aplica a cualquier especie ('mixed', 'other')
  label text not null,
  weight_kg numeric check (weight_kg > 0),    -- peso típico de adulto (perros); null en gatos
  aliases text[] not null default '{}'
);
alter table breeds enable row level security;
drop policy if exists "breeds readable" on breeds;
create policy "breeds readable" on breeds for select using (true);

insert into breeds (id, species, label, weight_kg, aliases) values
  ('chihuahua', 'dog', 'Chihuahua', 2.5, '{}'::text[]),
  ('yorkshire-terrier', 'dog', 'Yorkshire Terrier', 3.0, array['yorkshire','yorkie']::text[]),
  ('pomeranian', 'dog', 'Pomeranian', 3.0, '{}'::text[]),
  ('maltese', 'dog', 'Maltese', 3.0, '{}'::text[]),
  ('papillon', 'dog', 'Papillon', 4.0, '{}'::text[]),
  ('miniature-pinscher', 'dog', 'Miniature Pinscher', 4.0, array['min pin']::text[]),
  ('toy-poodle', 'dog', 'Toy Poodle', 3.5, '{}'::text[]),
  ('pekingese', 'dog', 'Pekingese', 5.0, array['pequines','pekinese']::text[]),
  ('havanese', 'dog', 'Havanese', 5.0, '{}'::text[]),
  ('bichon-frise', 'dog', 'Bichon Frise', 6.0, array['bichon']::text[]),
  ('shih-tzu', 'dog', 'Shih Tzu', 6.0, array['shihtzu']::text[]),
  ('lhasa-apso', 'dog', 'Lhasa Apso', 6.0, '{}'::text[]),
  ('cairn-terrier', 'dog', 'Cairn Terrier', 6.0, '{}'::text[]),
  ('rat-terrier', 'dog', 'Rat Terrier', 6.0, '{}'::text[]),
  ('jack-russell-terrier', 'dog', 'Jack Russell Terrier', 6.5, array['jack russell']::text[]),
  ('miniature-schnauzer', 'dog', 'Miniature Schnauzer', 7.0, array['mini schnauzer']::text[]),
  ('miniature-poodle', 'dog', 'Miniature Poodle', 7.0, '{}'::text[]),
  ('cavalier-king-charles-spaniel', 'dog', 'Cavalier King Charles Spaniel', 7.0, array['cavalier']::text[]),
  ('pug', 'dog', 'Pug', 8.0, '{}'::text[]),
  ('boston-terrier', 'dog', 'Boston Terrier', 8.0, '{}'::text[]),
  ('dachshund', 'dog', 'Dachshund', 9.0, array['salchicha','wiener']::text[]),
  ('west-highland-white-terrier', 'dog', 'West Highland White Terrier', 9.0, array['westie','west highland']::text[]),
  ('scottish-terrier', 'dog', 'Scottish Terrier', 9.0, '{}'::text[]),
  ('shiba-inu', 'dog', 'Shiba Inu', 10.0, array['shiba']::text[]),
  ('basenji', 'dog', 'Basenji', 10.0, '{}'::text[]),
  ('beagle', 'dog', 'Beagle', 11.0, '{}'::text[]),
  ('french-bulldog', 'dog', 'French Bulldog', 12.0, array['frenchie']::text[]),
  ('corgi', 'dog', 'Corgi', 12.0, array['pembroke']::text[]),
  ('whippet', 'dog', 'Whippet', 12.0, '{}'::text[]),
  ('cocker-spaniel', 'dog', 'Cocker Spaniel', 13.0, '{}'::text[]),
  ('staffordshire-terrier', 'dog', 'Staffordshire Terrier', 15.0, array['staffordshire','staffy']::text[]),
  ('brittany', 'dog', 'Brittany', 16.0, '{}'::text[]),
  ('australian-cattle-dog', 'dog', 'Australian Cattle Dog', 18.0, array['cattle dog','blue heeler']::text[]),
  ('border-collie', 'dog', 'Border Collie', 19.0, '{}'::text[]),
  ('poodle', 'dog', 'Poodle', 20.0, '{}'::text[]),
  ('australian-shepherd', 'dog', 'Australian Shepherd', 22.0, array['aussie']::text[]),
  ('siberian-husky', 'dog', 'Siberian Husky', 22.0, array['husky']::text[]),
  ('samoyed', 'dog', 'Samoyed', 22.0, '{}'::text[]),
  ('shar-pei', 'dog', 'Shar Pei', 22.0, '{}'::text[]),
  ('english-springer-spaniel', 'dog', 'English Springer Spaniel', 22.0, array['springer spaniel']::text[]),
  ('bulldog', 'dog', 'Bulldog', 24.0, array['english bulldog']::text[]),
  ('pit-bull', 'dog', 'Pit Bull', 25.0, array['pitbull']::text[]),
  ('basset-hound', 'dog', 'Basset Hound', 25.0, array['basset']::text[]),
  ('collie', 'dog', 'Collie', 25.0, '{}'::text[]),
  ('chow-chow', 'dog', 'Chow Chow', 25.0, '{}'::text[]),
  ('dalmatian', 'dog', 'Dalmatian', 25.0, '{}'::text[]),
  ('airedale-terrier', 'dog', 'Airedale Terrier', 25.0, array['airedale']::text[]),
  ('bull-terrier', 'dog', 'Bull Terrier', 25.0, '{}'::text[]),
  ('standard-poodle', 'dog', 'Standard Poodle', 25.0, '{}'::text[]),
  ('pointer', 'dog', 'Pointer', 25.0, '{}'::text[]),
  ('english-setter', 'dog', 'English Setter', 28.0, array['setter']::text[]),
  ('belgian-malinois', 'dog', 'Belgian Malinois', 28.0, array['malinois']::text[]),
  ('vizsla', 'dog', 'Vizsla', 27.0, '{}'::text[]),
  ('labrador-retriever', 'dog', 'Labrador Retriever', 30.0, array['labrador','lab']::text[]),
  ('golden-retriever', 'dog', 'Golden Retriever', 30.0, array['golden']::text[]),
  ('boxer', 'dog', 'Boxer', 30.0, '{}'::text[]),
  ('greyhound', 'dog', 'Greyhound', 30.0, '{}'::text[]),
  ('weimaraner', 'dog', 'Weimaraner', 32.0, '{}'::text[]),
  ('german-shepherd', 'dog', 'German Shepherd', 34.0, array['pastor aleman','alsatian']::text[]),
  ('doberman', 'dog', 'Doberman', 36.0, array['doberman pinscher']::text[]),
  ('akita', 'dog', 'Akita', 38.0, '{}'::text[]),
  ('alaskan-malamute', 'dog', 'Alaskan Malamute', 38.0, array['malamute']::text[]),
  ('bloodhound', 'dog', 'Bloodhound', 40.0, '{}'::text[]),
  ('bernese-mountain-dog', 'dog', 'Bernese Mountain Dog', 42.0, array['bernese']::text[]),
  ('rottweiler', 'dog', 'Rottweiler', 45.0, array['rottie']::text[]),
  ('cane-corso', 'dog', 'Cane Corso', 45.0, '{}'::text[]),
  ('great-pyrenees', 'dog', 'Great Pyrenees', 45.0, '{}'::text[]),
  ('great-dane', 'dog', 'Great Dane', 60.0, '{}'::text[]),
  ('newfoundland', 'dog', 'Newfoundland', 60.0, '{}'::text[]),
  ('saint-bernard', 'dog', 'Saint Bernard', 70.0, array['st bernard']::text[]),
  ('mastiff', 'dog', 'Mastiff', 75.0, '{}'::text[]),
  ('domestic-shorthair', 'cat', 'Domestic Shorthair', null, '{}'::text[]),
  ('domestic-longhair', 'cat', 'Domestic Longhair', null, '{}'::text[]),
  ('siamese', 'cat', 'Siamese', null, '{}'::text[]),
  ('persian', 'cat', 'Persian', null, '{}'::text[]),
  ('maine-coon', 'cat', 'Maine Coon', null, '{}'::text[]),
  ('ragdoll', 'cat', 'Ragdoll', null, '{}'::text[]),
  ('bengal', 'cat', 'Bengal', null, '{}'::text[]),
  ('british-shorthair', 'cat', 'British Shorthair', null, '{}'::text[]),
  ('american-shorthair', 'cat', 'American Shorthair', null, '{}'::text[]),
  ('exotic-shorthair', 'cat', 'Exotic Shorthair', null, '{}'::text[]),
  ('oriental-shorthair', 'cat', 'Oriental Shorthair', null, '{}'::text[]),
  ('sphynx', 'cat', 'Sphynx', null, '{}'::text[]),
  ('russian-blue', 'cat', 'Russian Blue', null, '{}'::text[]),
  ('scottish-fold', 'cat', 'Scottish Fold', null, '{}'::text[]),
  ('abyssinian', 'cat', 'Abyssinian', null, '{}'::text[]),
  ('birman', 'cat', 'Birman', null, '{}'::text[]),
  ('burmese', 'cat', 'Burmese', null, '{}'::text[]),
  ('balinese', 'cat', 'Balinese', null, '{}'::text[]),
  ('himalayan', 'cat', 'Himalayan', null, '{}'::text[]),
  ('norwegian-forest', 'cat', 'Norwegian Forest', null, '{}'::text[]),
  ('siberian-cat', 'cat', 'Siberian', null, '{}'::text[]),
  ('turkish-angora', 'cat', 'Turkish Angora', null, '{}'::text[]),
  ('devon-rex', 'cat', 'Devon Rex', null, '{}'::text[]),
  ('cornish-rex', 'cat', 'Cornish Rex', null, '{}'::text[]),
  ('tonkinese', 'cat', 'Tonkinese', null, '{}'::text[]),
  ('savannah', 'cat', 'Savannah', null, '{}'::text[]),
  ('ragamuffin', 'cat', 'Ragamuffin', null, '{}'::text[]),
  ('manx', 'cat', 'Manx', null, '{}'::text[])
on conflict (id) do update set species = excluded.species, label = excluded.label, weight_kg = excluded.weight_kg, aliases = excluded.aliases;
insert into breeds (id, species, label) values ('mixed', null, 'Mixed / Not sure'), ('other', null, 'Other')
on conflict (id) do update set label = excluded.label;

-- ── 2. Columnas ───────────────────────────────────────────────────────────────────────────────────────────────────────
alter table pets    add column if not exists breed_id text references breeds(id);
alter table reports add column if not exists breed_id text references breeds(id);
grant select (breed_id) on reports to anon, authenticated;

-- ── 3. Comparación por id ─────────────────────────────────────────────────────────────────────────────────────────────
-- exact = misma raza · similar = perros de otra raza con peso compatible (razón ≤ 1.7) · different = gatos de otra raza (NO descarta)
-- unknown = falta el dato o es genérico · incompatible = perros con pesos muy distintos (único caso que descarta)
create or replace function breed_compat_v2(a_id text, a_text text, b_id text, b_text text, sp species_type) returns text
language plpgsql stable set search_path = public as $$
declare wa numeric; wb numeric;
begin
  if a_id is not null and b_id is not null and a_id not in ('mixed', 'other') and b_id not in ('mixed', 'other') then
    if a_id = b_id then return 'exact'; end if;
    if sp = 'dog' then
      select weight_kg into wa from breeds where id = a_id;
      select weight_kg into wb from breeds where id = b_id;
      if wa is null or wb is null then return 'unknown'; end if;
      return case when greatest(wa, wb) / least(wa, wb) <= 1.7 then 'similar' else 'incompatible' end;
    elsif sp = 'cat' then
      if a_id like 'domestic-%' or b_id like 'domestic-%' then return 'unknown'; end if;
      return 'different';
    end if;
    return 'unknown';
  end if;
  if a_id = 'mixed' or b_id = 'mixed' then return 'unknown'; end if;
  return breed_compat(a_text, b_text, sp);   -- datos antiguos o "Other": por texto, como hasta ahora
end $$;

create or replace function match_breed_compat(l reports, s reports) returns text language sql stable set search_path = public as $$
  select breed_compat_v2(l.breed_id, l.breed, s.breed_id, s.breed, l.species)
$$;

-- 'strong' = raza idéntica Y foto en el avistamiento (0012). (La 0017 le añade color y tamaño.)
create or replace function match_confidence_for(l reports, s reports) returns match_confidence language sql stable set search_path = public as $$
  select case when match_breed_compat(l, s) = 'exact' and s.photo_url is not null then 'strong'::match_confidence else 'possible'::match_confidence end
$$;

create or replace function match_new_sighting() returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  if new.status <> 'sighted' then return new; end if;
  insert into matches (lost_report_id, sighted_report_id, confidence, distance_mi, reasons)
  select l.id, new.id,
         match_confidence_for(l, new),
         round(d.miles::numeric, 2),
         jsonb_build_object(
           'same_species', true, 'breed', c.k, 'has_photo', new.photo_url is not null,
           'distance_mi', round(d.miles::numeric, 2), 'radius_mi', match_radius_mi(new.created_at - l.created_at),
           'seen_after_loss', true,
           'minutes_after_loss', round((extract(epoch from (new.created_at - l.created_at)) / 60)::numeric),
           'passes_rules', true)
  from reports l
  cross join lateral (select st_distance(l.location, new.location) / 1609.344 as miles) d
  cross join lateral (select match_breed_compat(l, new) as k) c
  where l.status = 'lost' and l.user_id <> new.user_id and l.species = new.species
    and new.created_at >= l.created_at
    and d.miles <= match_radius_mi(new.created_at - l.created_at)
    and c.k <> 'incompatible'
  on conflict do nothing;
  return new;
end $$;

create or replace function recompute_matches_for_lost(p_lost uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare l reports;
begin
  select * into l from reports where id = p_lost and status = 'lost';
  if not found then return; end if;

  update matches m set
    distance_mi = round((st_distance(l.location, s.location) / 1609.344)::numeric, 2),
    confidence = match_confidence_for(l, s),
    reasons = jsonb_build_object(
      'same_species', l.species = s.species,
      'breed', match_breed_compat(l, s),
      'has_photo', s.photo_url is not null,
      'distance_mi', round((st_distance(l.location, s.location) / 1609.344)::numeric, 2),
      'radius_mi', match_radius_mi(s.created_at - l.created_at),
      'seen_after_loss', s.created_at >= l.created_at,
      'minutes_after_loss', round((extract(epoch from (s.created_at - l.created_at)) / 60)::numeric),
      'passes_rules', (l.species = s.species
                       and s.created_at >= l.created_at
                       and st_distance(l.location, s.location) / 1609.344 <= match_radius_mi(s.created_at - l.created_at)
                       and match_breed_compat(l, s) <> 'incompatible'))
  from reports s
  where m.lost_report_id = l.id and m.sighted_report_id = s.id;

  insert into matches (lost_report_id, sighted_report_id, confidence, distance_mi, reasons)
  select l.id, s.id, match_confidence_for(l, s), round(d.miles::numeric, 2),
         jsonb_build_object(
           'same_species', true, 'breed', c.k, 'has_photo', s.photo_url is not null,
           'distance_mi', round(d.miles::numeric, 2), 'radius_mi', match_radius_mi(s.created_at - l.created_at),
           'seen_after_loss', true,
           'minutes_after_loss', round((extract(epoch from (s.created_at - l.created_at)) / 60)::numeric),
           'passes_rules', true)
  from reports s
  cross join lateral (select st_distance(l.location, s.location) / 1609.344 as miles) d
  cross join lateral (select match_breed_compat(l, s) as k) c
  where s.status = 'sighted' and s.user_id <> l.user_id and s.species = l.species
    and s.created_at >= l.created_at
    and d.miles <= match_radius_mi(s.created_at - l.created_at)
    and c.k <> 'incompatible'
  on conflict do nothing;
end $$;

-- Editar la mascota → su Lost activo: ahora copia también breed_id, y el trigger de recálculo mira breed_id.
create or replace function sync_pet_to_active_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.name, new.species, new.breed, new.breed_id, new.photo_url) is distinct from (old.name, old.species, old.breed, old.breed_id, old.photo_url) then
    update reports set
      name = new.name, species = new.species, breed = new.breed, breed_id = new.breed_id, photo_url = new.photo_url,
      photo_focus_x = case when photo_url is distinct from new.photo_url then null else photo_focus_x end,
      photo_focus_y = case when photo_url is distinct from new.photo_url then null else photo_focus_y end,
      photo_zoom    = case when photo_url is distinct from new.photo_url then null else photo_zoom end
    where pet_id = new.id and status = 'lost';
  end if;
  return new;
end $$;
drop trigger if exists reports_recompute_matches on reports;
create trigger reports_recompute_matches after update of species, breed, breed_id, photo_url on reports
  for each row when (new.status = 'lost') execute function reports_recompute_matches();

-- ── 4. Migración de los valores existentes ────────────────────────────────────────────────────────────────────────────
-- Mapea un texto de raza a su id: blanco → null; "mixed / unknown / not sure…" → 'mixed'; si no, la raza (o alias) que contenga el texto,
-- prefiriendo la coincidencia exacta y luego la etiqueta más larga. Sin coincidencia → null (queda en la lista de no mapeados).
create or replace function map_breed_to_id(txt text, sp species_type) returns text language sql stable set search_path = public as $$
  with t as (select norm_breed(txt) as n)
  select b.id from breeds b, t
  where t.n is not null and b.species = sp
    and (t.n ~ ('\m' || norm_breed(b.label) || '\M')
         or exists (select 1 from unnest(b.aliases) a where t.n ~ ('\m' || norm_breed(a) || '\M')))
  order by (t.n = norm_breed(b.label) or t.n = any (select norm_breed(a) from unnest(b.aliases) a)) desc, length(b.label) desc
  limit 1
$$;

create or replace function map_breed_or_mixed(txt text, sp species_type) returns text language sql stable set search_path = public as $$
  select case
    when btrim(coalesce(txt, '')) = '' then null
    when norm_breed(txt) is null or lower(btrim(txt)) ~ '^(unknown|unsure|not sure|mutt|no idea)$' then 'mixed'
    else map_breed_to_id(txt, sp) end
$$;

do $$
begin
  -- Los cambios de raza en Lost activos disparan el recálculo de coincidencias: sin avisos push por coincidencias que ya existían.
  if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
    alter table matches disable trigger matches_notify;
  end if;

  update pets    set breed_id = map_breed_or_mixed(breed, species) where breed_id is null and breed is not null;
  update reports set breed_id = map_breed_or_mixed(breed, species) where breed_id is null and breed is not null;

  -- Sinónimo puro ("Pequines", "golden retriever") → etiqueta canónica. Los textos con más información ("Beagle mix") se conservan.
  update pets p set breed = b.label from breeds b
  where p.breed_id = b.id and b.species is not null and p.breed is distinct from b.label
    and (norm_breed(p.breed) = norm_breed(b.label) or norm_breed(p.breed) = any (select norm_breed(a) from unnest(b.aliases) a));
  update reports r set breed = b.label from breeds b
  where r.breed_id = b.id and b.species is not null and r.breed is distinct from b.label
    and (norm_breed(r.breed) = norm_breed(b.label) or norm_breed(r.breed) = any (select norm_breed(a) from unnest(b.aliases) a));

  if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
    alter table matches enable trigger matches_notify;
  end if;
end $$;

-- Recalcula las coincidencias de todos los Lost activos con el criterio por id.
do $$
declare x record;
begin
  if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
    alter table matches disable trigger matches_notify;
  end if;
  for x in select id from reports where status = 'lost' loop perform recompute_matches_for_lost(x.id); end loop;
  if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
    alter table matches enable trigger matches_notify;
  end if;
end $$;

-- ── Valores que NO se pudieron mapear (deben revisarse a mano) ─────────────────────────────────────────────────────────
--   select 'pets' as origen, species, breed, count(*) from pets where breed is not null and breed_id is null group by 1, 2, 3
--   union all
--   select 'reports', species, breed, count(*) from reports where breed is not null and breed_id is null group by 1, 2, 3
--   order by 1, 2, 3;
--
-- Criterio de aceptación (raza de Lazy): debe devolver 'pekingese' (o la raza real de Lazy) y no null:
--   select name, breed, breed_id from pets where lower(name) = 'lazy';
