-- Punto focal de la foto (dónde está la cabeza del animal), en % del ancho/alto, y zoom en % para miniaturas.
-- Sin esto, el recorte "cover" centrado corta las cabezas en fotos verticales. Valores del seed = `head` y `zoom` del prototipo.
-- Fotos subidas desde la app quedan en null: la app usa un foco por defecto sesgado hacia arriba.
alter table reports
  add column if not exists photo_focus_x smallint,
  add column if not exists photo_focus_y smallint,
  add column if not exists photo_zoom smallint;
grant select (photo_focus_x, photo_focus_y, photo_zoom) on reports to anon, authenticated;

update reports set photo_focus_x = 50, photo_focus_y = 30, photo_zoom = 190 where id = '10000000-0000-0000-0000-000000000001'; -- Max
update reports set photo_focus_x = 32, photo_focus_y = 26, photo_zoom = 190 where id = '10000000-0000-0000-0000-000000000002'; -- Unknown dog (beagle)
update reports set photo_focus_x = 50, photo_focus_y = 34, photo_zoom = 240 where id = '10000000-0000-0000-0000-000000000003'; -- Unknown cat
update reports set photo_focus_x = 50, photo_focus_y = 26, photo_zoom = 190 where id = '10000000-0000-0000-0000-000000000004'; -- Biscuit
update reports set photo_focus_x = 50, photo_focus_y = 30, photo_zoom = 190 where id = '10000000-0000-0000-0000-000000000005'; -- Luna

-- Vista de reportes activos con las columnas nuevas (siguen sin incluir el contacto).
drop view if exists active_reports;
create view active_reports as
select id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
       features_description, location, location_label, pet_id, matched_report_id, created_at, reunited_at
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
  features_description text, location_label text, created_at timestamptz,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.status, r.species, r.name, r.breed, r.photo_url, r.photo_focus_x, r.photo_focus_y, r.photo_zoom,
         r.features_description, r.location_label, r.created_at,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from active_reports r
  where st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by
    (r.status = 'lost' and r.created_at > now() - interval '72 hours') desc,
    r.created_at desc;
$$;
grant execute on function reports_nearby(double precision, double precision, double precision) to anon, authenticated;

drop function if exists my_matches();
create function my_matches()
returns table (
  id uuid, lost_report_id uuid, lost_name text, sighted_report_id uuid, confidence match_confidence,
  dismissed boolean, created_at timestamptz, sighted_photo_url text, sighted_label text, sighted_breed text,
  sighted_focus_x smallint, sighted_focus_y smallint, sighted_zoom smallint
)
language sql stable as $$
  select m.id, m.lost_report_id, l.name, m.sighted_report_id, m.confidence, m.dismissed, m.created_at,
         s.photo_url, s.location_label, s.breed, s.photo_focus_x, s.photo_focus_y, s.photo_zoom
  from matches m
  join reports l on l.id = m.lost_report_id
  join reports s on s.id = m.sighted_report_id
  where l.user_id = auth.uid() and l.status = 'lost' and s.status = 'sighted'
    and s.created_at > now() - interval '48 hours'
  order by m.created_at desc;
$$;
grant execute on function my_matches() to authenticated;
