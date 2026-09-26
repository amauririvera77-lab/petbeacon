-- 0020 · Acciones sobre avistamientos propios (My Reports 4.1) — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar. Requiere 0014 y 0017.
--
-- Qué hace:
--  1. reports.last_seen_at: "Still there". Actualiza la hora del último avistamiento y lo mantiene activo. La retención de un avistamiento
--     en el feed y el mapa (48 h) ahora cuenta desde coalesce(last_seen_at, created_at). created_at NO cambia (las coincidencias siguen
--     comparando contra la hora original del avistamiento).
--  2. reports.resolution / resolved_at: "Mark as resolved" con una de tres razones: 'returned_to_owner', 'no_longer_there',
--     'taken_to_shelter_or_vet'. El avistamiento pasa a status 'resolved' (valor añadido en la 0014): deja de aparecer en el feed y el mapa
--     (active_reports solo incluye lost / sighted / reunited) y deja de generar coincidencias (el matching solo mira status = 'sighted';
--     my_matches() ya exige s.status = 'sighted', así que desaparece también de las coincidencias del dueño del Lost).
--  3. Dos funciones limitadas al dueño (auth.uid(), search_path fijo): sighting_still_there(id) y resolve_sighting(id, resolution). Solo
--     actúan sobre avistamientos propios que siguen en status 'sighted'.
--  4. active_reports y reports_nearby() incluyen last_seen_at (mismas columnas que 0017 + esa).
-- Es re-ejecutable.

alter table reports add column if not exists last_seen_at timestamptz;
alter table reports add column if not exists resolution text;
alter table reports add column if not exists resolved_at timestamptz;
alter table reports drop constraint if exists reports_resolution_check;
alter table reports add constraint reports_resolution_check
  check (resolution is null or resolution in ('returned_to_owner', 'no_longer_there', 'taken_to_shelter_or_vet'));
grant select (last_seen_at, resolution, resolved_at) on reports to anon, authenticated;

drop view if exists active_reports;
create view active_reports as
select id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
       features_description, condition, color, size, location, location_label, pet_id, matched_report_id, created_at, reunited_at, last_seen_at
from reports
where status = 'lost'
   or (status = 'sighted' and coalesce(last_seen_at, created_at) > now() - interval '48 hours')
   or (status = 'reunited' and reunited_at > now() - interval '24 hours');
grant select on active_reports to anon, authenticated;

drop function if exists reports_nearby(double precision, double precision, double precision);
create function reports_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, status report_status, species species_type, name text, breed text, photo_url text,
  photo_focus_x smallint, photo_focus_y smallint, photo_zoom smallint,
  features_description text, condition text, color text, size text, location_label text, created_at timestamptz, last_seen_at timestamptz,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.status, r.species, r.name, r.breed, r.photo_url, r.photo_focus_x, r.photo_focus_y, r.photo_zoom,
         r.features_description, r.condition, r.color, r.size, r.location_label, r.created_at, r.last_seen_at,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from active_reports r
  where st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by
    (r.status = 'lost' and r.created_at > now() - interval '72 hours') desc,
    coalesce(r.last_seen_at, r.created_at) desc;
$$;
grant execute on function reports_nearby(double precision, double precision, double precision) to anon, authenticated;

create or replace function sighting_still_there(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update reports set last_seen_at = now() where id = p_id and user_id = auth.uid() and status = 'sighted';
  if not found then raise exception 'Sighting not found.' using errcode = 'P0002'; end if;
end $$;
revoke all on function sighting_still_there(uuid) from public, anon;
grant execute on function sighting_still_there(uuid) to authenticated;

create or replace function resolve_sighting(p_id uuid, p_resolution text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_resolution not in ('returned_to_owner', 'no_longer_there', 'taken_to_shelter_or_vet') then
    raise exception 'Invalid resolution.' using errcode = '22023';
  end if;
  update reports set status = 'resolved', resolution = p_resolution, resolved_at = now()
  where id = p_id and user_id = auth.uid() and status = 'sighted';
  if not found then raise exception 'Sighting not found.' using errcode = 'P0002'; end if;
end $$;
revoke all on function resolve_sighting(uuid, text) from public, anon;
grant execute on function resolve_sighting(uuid, text) to authenticated;
