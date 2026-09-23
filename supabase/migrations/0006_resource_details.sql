-- Datos que muestra la hoja "Resource detail": horario y foto. Ambos opcionales.
alter table resources add column if not exists hours text;
alter table resources add column if not exists photo_url text;

-- Cambia el tipo de retorno, así que hay que recrear la función.
drop function if exists resources_nearby(double precision, double precision, double precision);
create function resources_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, name text, category resource_category, description text, address text,
  phone text, website_url text, is_featured_event boolean, icon text, hours text, photo_url text,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.name, r.category, r.description, r.address, r.phone, r.website_url,
         r.is_featured_event, r.icon, r.hours, r.photo_url,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from resources r
  where r.location is not null
    and st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by 14;
$$;
grant execute on function resources_nearby(double precision, double precision, double precision) to anon, authenticated;

-- El evento destacado del prototipo (Free pet food pantry).
update resources
set hours = 'This Saturday, 9am–1pm',
    photo_url = 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200&q=80&auto=format&fit=crop'
where name = 'Free pet food pantry';
