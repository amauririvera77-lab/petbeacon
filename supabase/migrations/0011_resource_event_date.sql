-- 0011 · Fecha concreta de los eventos de recursos — APROBADA por el usuario en la auditoría; aplicar en el SQL Editor.
--
-- La tarjeta de recurso comunitario del feed muestra "This Saturday, Oct 3". Hoy `resources.hours` guarda solo texto relativo
-- ("This Saturday, 9am–1pm"), que envejece mal. Esta migración agrega una fecha real (`event_date`) y la devuelve en resources_nearby().
--   · Nullable: los recursos sin evento (la mayoría) no tienen fecha.
--   · Si falta, la app cae al texto de `hours` tal como está.

alter table resources add column if not exists event_date date;

-- Cambia el tipo de retorno, así que se recrea la función (mismas columnas que 0006 + event_date).
drop function if exists resources_nearby(double precision, double precision, double precision);
create function resources_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, name text, category resource_category, description text, address text,
  phone text, website_url text, is_featured_event boolean, icon text, hours text, event_date date, photo_url text,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.name, r.category, r.description, r.address, r.phone, r.website_url,
         r.is_featured_event, r.icon, r.hours, r.event_date, r.photo_url,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from resources r
  where r.location is not null
    and st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by 15;
$$;
grant execute on function resources_nearby(double precision, double precision, double precision) to anon, authenticated;

-- Datos de prueba: el evento destacado ("Free pet food pantry") pasa a ser el próximo sábado (hoy, si es sábado).
-- dow: domingo = 0 … sábado = 6.
update resources
set event_date = current_date + ((6 - extract(dow from current_date)::int + 7) % 7)
where name = 'Free pet food pantry';
