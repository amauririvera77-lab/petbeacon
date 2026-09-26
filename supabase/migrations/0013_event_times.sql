-- 0013 · Hora de inicio y de fin de los eventos de recursos — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar.
--
-- Problema (evaluación UX, E.1/E.2): hoy un evento solo tiene fecha (`event_date`, 0011) y un texto libre `hours` ("This Saturday, 9am–1pm").
-- Sin hora de inicio/fin estructurada la app no puede saber si el evento está EN CURSO ni ocultarlo cuando TERMINA (solo cuando cambia
-- el día). Esta migración agrega dos columnas:
--   · event_starts_at  timestamptz  — cuándo empieza
--   · event_ends_at    timestamptz  — cuándo termina (con esto se oculta el evento del feed y del mapa)
-- Ambas son nullable: los recursos que no son eventos no las usan, y un evento sin horas sigue funcionando como hasta ahora (se muestra
-- todo su día `event_date` y desaparece al terminar ese día).
--
-- Zona horaria: se guardan como timestamptz (un instante absoluto). Los datos de demo se calculan en America/New_York (North Bergen, NJ);
-- la app las muestra en la hora local del dispositivo. Un evento real debería guardarse con la zona del lugar donde ocurre.
--
-- Efectos: resources_nearby() se recrea con las dos columnas nuevas después de event_date (mismo resto que 0011). Se mantiene event_date.
-- Es re-ejecutable.

alter table resources add column if not exists event_starts_at timestamptz;
alter table resources add column if not exists event_ends_at timestamptz;

alter table resources drop constraint if exists resources_event_window_check;
alter table resources add constraint resources_event_window_check
  check (event_ends_at is null or event_starts_at is null or event_ends_at > event_starts_at);

drop function if exists resources_nearby(double precision, double precision, double precision);
create function resources_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, name text, category resource_category, description text, address text,
  phone text, website_url text, is_featured_event boolean, icon text, hours text,
  event_date date, event_starts_at timestamptz, event_ends_at timestamptz, photo_url text,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.name, r.category, r.description, r.address, r.phone, r.website_url,
         r.is_featured_event, r.icon, r.hours, r.event_date, r.event_starts_at, r.event_ends_at, r.photo_url,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from resources r
  where r.location is not null
    and st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by 17;
$$;
grant execute on function resources_nearby(double precision, double precision, double precision) to anon, authenticated;

-- Datos de demo: "Free pet food pantry" (9am–1pm, hora de Nueva York) en su event_date actual.
update resources
set event_starts_at = (event_date::timestamp + time '09:00') at time zone 'America/New_York',
    event_ends_at   = (event_date::timestamp + time '13:00') at time zone 'America/New_York'
where name = 'Free pet food pantry' and event_date is not null and event_starts_at is null;
