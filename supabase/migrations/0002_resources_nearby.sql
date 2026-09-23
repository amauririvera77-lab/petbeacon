-- Recursos de Support and care con coordenadas legibles (PostgREST devuelve geography como hex EWKB).
-- Se usa en el mapa de Home (pines de recurso) y, más adelante, en Support and care.
create or replace function resources_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, name text, category resource_category, description text, address text,
  phone text, website_url text, is_featured_event boolean, icon text,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.name, r.category, r.description, r.address, r.phone, r.website_url,
         r.is_featured_event, r.icon,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from resources r
  where r.location is not null
    and st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by 12;
$$;
