-- reports.breed_id (canónico, 0016) nunca llegaba a active_reports/reports_nearby()/my_matches() — solo breed (texto libre). Por eso
-- el feed de Home y PinDetailSheet mostraban el texto antiguo tal cual se guardó ("Siamese cat") en vez de la etiqueta canónica
-- ("Siamese") que ya usan las pantallas que leen `reports` directamente (My Reports). Se recrean con las mismas columnas de antes
-- + breed_id (y, en my_matches(), sighted_breed_id). Es re-ejecutable.

drop view if exists active_reports;
create view active_reports as
select id, user_id, status, species, name, breed, breed_id, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
       features_description, condition, color, size, location, location_label, pet_id, matched_report_id, created_at, reunited_at, last_seen_at
from reports
where status = 'lost'
   or (status = 'sighted' and coalesce(last_seen_at, created_at) > now() - interval '48 hours')
   or (status = 'reunited' and reunited_at > now() - interval '24 hours');
grant select on active_reports to anon, authenticated;

drop function if exists reports_nearby(double precision, double precision, double precision);
create function reports_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, status report_status, species species_type, name text, breed text, breed_id text, photo_url text,
  photo_focus_x smallint, photo_focus_y smallint, photo_zoom smallint,
  features_description text, condition text, color text, size text, location_label text, created_at timestamptz, last_seen_at timestamptz,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.status, r.species, r.name, r.breed, r.breed_id, r.photo_url, r.photo_focus_x, r.photo_focus_y, r.photo_zoom,
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

drop function if exists my_matches();
create function my_matches()
returns table (
  id uuid, lost_report_id uuid, lost_name text, sighted_report_id uuid, confidence match_confidence,
  dismissed boolean, created_at timestamptz, sighted_created_at timestamptz, sighted_species species_type,
  sighted_photo_url text, sighted_label text, sighted_breed text, sighted_breed_id text,
  sighted_focus_x smallint, sighted_focus_y smallint, sighted_zoom smallint,
  distance_mi numeric, reasons jsonb
)
language sql stable as $$
  select m.id, m.lost_report_id, l.name, m.sighted_report_id, m.confidence, m.dismissed, m.created_at,
         s.created_at, s.species, s.photo_url, s.location_label, s.breed, s.breed_id,
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
