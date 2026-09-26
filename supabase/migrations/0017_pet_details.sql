-- 0017 · Datos del perfil de mascota + retirar mascotas — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar. Requiere 0014–0016.
--
-- Qué hace (Pet profile 2.2 y 2.6):
--  1. `pets` gana: color, size (small/medium/large), features (rasgos distintivos), microchip, archived_at y archived_reason.
--     · El MICROCHIP vive solo en `pets`, y `pets` ya es privada del dueño (política RLS "own pets": user_id = auth.uid()). Ninguna vista,
--       función pública ni copia a `reports` lo expone: solo el dueño lo lee y se usa para verificación.
--  2. `reports` gana color y size (públicos, como la raza) para que quien busca vea "Brown · Small" y para el matching. Se otorga
--     su lectura y se incluyen en active_reports y reports_nearby().
--  3. Editar la mascota actualiza en su Lost activo SOLO los campos que cambiaron (nombre, especie, raza, foto, color, tamaño, rasgos).
--  4. El matching usa color y tamaño cuando ambos lados los tienen: si difieren, una coincidencia 'strong' baja a 'possible'. NUNCA descarta.
--     El color solo cuenta si es uno de los colores de la lista (un color escrito a mano no se compara).
--  5. Retirar una mascota: archive_pet(pet, reason) con reason 'removed' ("Remove from my profile") o 'passed_away'. Solo el dueño (auth.uid()).
--     Con un Lost activo, 'removed' se rechaza y 'passed_away' lo cierra ('closed') SIN enviar alertas (los avisos solo salen al insertar).
--     La mascota no se borra: se archiva (desaparece de la lista de mascotas activas; sus reportes quedan en el historial).
--  6. No se puede crear un Lost para una mascota archivada.
-- Es re-ejecutable.

-- ── 1 y 2. Columnas ───────────────────────────────────────────────────────────────────────────────────────────────────
alter table pets add column if not exists color text;
alter table pets add column if not exists size text;
alter table pets add column if not exists features text;
alter table pets add column if not exists microchip text;
alter table pets add column if not exists archived_at timestamptz;
alter table pets add column if not exists archived_reason text;
alter table pets drop constraint if exists pets_size_check;
alter table pets add constraint pets_size_check check (size is null or size in ('small', 'medium', 'large'));
alter table pets drop constraint if exists pets_archived_reason_check;
alter table pets add constraint pets_archived_reason_check check (archived_reason is null or archived_reason in ('removed', 'passed_away'));
alter table pets drop constraint if exists pets_features_len;
alter table pets add constraint pets_features_len check (features is null or char_length(features) <= 100);

alter table reports add column if not exists color text;
alter table reports add column if not exists size text;
alter table reports drop constraint if exists reports_size_check;
alter table reports add constraint reports_size_check check (size is null or size in ('small', 'medium', 'large'));
grant select (color, size) on reports to anon, authenticated;

-- active_reports y reports_nearby() devuelven color y tamaño (mismas columnas que 0012 + esas dos).
drop view if exists active_reports;
create view active_reports as
select id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
       features_description, condition, color, size, location, location_label, pet_id, matched_report_id, created_at, reunited_at
from reports
where status = 'lost'
   or (status = 'sighted' and created_at > now() - interval '48 hours')
   or (status = 'reunited' and reunited_at > now() - interval '24 hours');
grant select on active_reports to anon, authenticated;

drop function if exists reports_nearby(double precision, double precision, double precision);
create function reports_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, status report_status, species species_type, name text, breed text, photo_url text,
  photo_focus_x smallint, photo_focus_y smallint, photo_zoom smallint,
  features_description text, condition text, color text, size text, location_label text, created_at timestamptz,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.status, r.species, r.name, r.breed, r.photo_url, r.photo_focus_x, r.photo_focus_y, r.photo_zoom,
         r.features_description, r.condition, r.color, r.size, r.location_label, r.created_at,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from active_reports r
  where st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by
    (r.status = 'lost' and r.created_at > now() - interval '72 hours') desc,
    r.created_at desc;
$$;
grant execute on function reports_nearby(double precision, double precision, double precision) to anon, authenticated;

-- ── 3. Mascota → Lost activo: solo los campos que cambiaron ───────────────────────────────────────────────────────────
create or replace function sync_pet_to_active_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update reports set
    name     = case when new.name     is distinct from old.name     then new.name     else name end,
    species  = case when new.species  is distinct from old.species  then new.species  else species end,
    breed    = case when new.breed    is distinct from old.breed    then new.breed    else breed end,
    breed_id = case when new.breed_id is distinct from old.breed_id then new.breed_id else breed_id end,
    color    = case when new.color    is distinct from old.color    then new.color    else color end,
    size     = case when new.size     is distinct from old.size     then new.size     else size end,
    features_description = case when new.features is distinct from old.features then new.features else features_description end,
    photo_url = case when new.photo_url is distinct from old.photo_url then new.photo_url else photo_url end,
    -- una foto nueva invalida el punto focal y el zoom de la anterior
    photo_focus_x = case when new.photo_url is distinct from old.photo_url then null else photo_focus_x end,
    photo_focus_y = case when new.photo_url is distinct from old.photo_url then null else photo_focus_y end,
    photo_zoom    = case when new.photo_url is distinct from old.photo_url then null else photo_zoom end
  where pet_id = new.id and status = 'lost'
    and (new.name, new.species, new.breed, new.breed_id, new.color, new.size, new.features, new.photo_url)
        is distinct from (old.name, old.species, old.breed, old.breed_id, old.color, old.size, old.features, old.photo_url);
  return new;
end $$;

drop trigger if exists reports_recompute_matches on reports;
create trigger reports_recompute_matches after update of species, breed, breed_id, color, size, photo_url on reports
  for each row when (new.status = 'lost') execute function reports_recompute_matches();

-- ── 4. 'strong' = raza idéntica + foto, y sin color ni tamaño en contra ───────────────────────────────────────────────
create or replace function is_known_color(c text) returns boolean language sql immutable as $$
  select c in ('black', 'white', 'brown', 'golden', 'gray', 'orange', 'cream', 'multicolor')
$$;

create or replace function match_confidence_for(l reports, s reports) returns match_confidence language sql stable set search_path = public as $$
  select case
    when match_breed_compat(l, s) = 'exact' and s.photo_url is not null
         and not (is_known_color(l.color) and is_known_color(s.color) and l.color <> s.color)
         and not (l.size is not null and s.size is not null and l.size <> s.size)
    then 'strong'::match_confidence else 'possible'::match_confidence end
$$;

-- ── 5. Retirar una mascota ────────────────────────────────────────────────────────────────────────────────────────────
create or replace function archive_pet(p_pet uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_reason not in ('removed', 'passed_away') then raise exception 'Invalid reason.' using errcode = '22023'; end if;
  if not exists (select 1 from pets where id = p_pet and user_id = auth.uid() and archived_at is null) then
    raise exception 'Pet not found.' using errcode = 'P0002';
  end if;
  if exists (select 1 from reports where pet_id = p_pet and status = 'lost') then
    if p_reason = 'removed' then
      raise exception 'This pet has an active Lost report. Close the report first.' using errcode = '23503';
    end if;
    update reports set status = 'closed' where pet_id = p_pet and status = 'lost';   -- sin alertas ni mensajes: los avisos solo salen al insertar
  end if;
  update pets set archived_at = now(), archived_reason = p_reason where id = p_pet;
end $$;
revoke all on function archive_pet(uuid, text) from public, anon;
grant execute on function archive_pet(uuid, text) to authenticated;

-- ── 6. No se crea un Lost para una mascota archivada ──────────────────────────────────────────────────────────────────
create or replace function reports_pet_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'lost' and new.pet_id is null then
    raise exception 'A Lost report must be linked to one of your pets.' using errcode = '23514';
  end if;
  if new.pet_id is not null and not exists (select 1 from pets where id = new.pet_id and user_id = new.user_id) then
    raise exception 'That pet does not belong to this account.' using errcode = '42501';
  end if;
  if new.status = 'lost' and exists (select 1 from pets where id = new.pet_id and archived_at is not null) then
    raise exception 'This pet was removed from your profile.' using errcode = '23514';
  end if;
  return new;
end $$;

-- Verificación del microchip (debe fallar/devolver vacío desde una sesión ajena o anónima):
--   select microchip from pets;   -- solo devuelve las filas del propio usuario (RLS)
