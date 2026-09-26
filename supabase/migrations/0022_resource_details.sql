-- 0022 · Datos de los recursos de Support and care — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar. Requiere 0021.
--
-- Qué hace (Support and care, fase 5):
--  1. is_sample (5.1): todos los recursos actuales son ficticios. Se agrega `is_sample boolean not null default false` y se marcan como true
--     los existentes. La app muestra "Sample data" y deshabilita llamar, WhatsApp, web y direcciones mientras is_sample sea true.
--  2. Descripción de eventos sin fecha ni horario (5.2): se quita de `description` el prefijo "This Saturday, 9am-1pm." de los eventos
--     (el estado dinámico "Happening now · until 1pm" ya lo resuelve). Solo toca recursos que son eventos (is_featured_event).
--  3. Datos para decidir (5.4): `opening_hours` (jsonb, horarios semanales por día: {"mon": [["09:00","17:00"]], …}) con `timezone`
--     (por defecto America/New_York) para "Open now" / "Closed · Opens 9am"; `tags` (text[]: free, low_cost, income_based, walk_ins) para las
--     etiquetas "Free", "Low cost", "Income-based", "Walk-ins welcome"; e `in_person` (atención presencial) para elegir la acción principal
--     (Contact vs. Learn more).
--  4. Riverside Animal Sanctuary pasa a la categoría 'shelter' (5.5).
--  5. resources_nearby() devuelve las columnas nuevas. Se asegura también event_starts_at / event_ends_at (0013) para que esta migración sea
--     autosuficiente aunque la 0013 no se haya aplicado.
--  6. Datos de demo: horarios, etiquetas y in_person de los 8 recursos ficticios.
-- Es re-ejecutable.

alter table resources add column if not exists is_sample boolean not null default false;
update resources set is_sample = true where is_sample = false;   -- todos los recursos actuales son ficticios

alter table resources add column if not exists opening_hours jsonb;
alter table resources add column if not exists timezone text not null default 'America/New_York';
alter table resources add column if not exists tags text[] not null default '{}';
alter table resources add column if not exists in_person boolean not null default true;
alter table resources add column if not exists event_starts_at timestamptz;
alter table resources add column if not exists event_ends_at timestamptz;

-- 5.2 · La descripción de un evento no repite fecha ni horario.
update resources
set description = btrim(regexp_replace(description,
      '^\s*((this|next)\s+)?(mon|tues|wednes|thurs|fri|satur|sun)day[,.]?\s*\d{1,2}(:\d{2})?\s*(am|pm)?\s*(-|–|—|to)\s*\d{1,2}(:\d{2})?\s*(am|pm)\.?\s*', '', 'i'))
where is_featured_event and description ~* '^\s*((this|next)\s+)?(mon|tues|wednes|thurs|fri|satur|sun)day';

-- 5.5 · Recursos de entrega o ingreso a refugio.
update resources set category = 'shelter' where name = 'Riverside Animal Sanctuary';

-- 6 · Datos de demo (ficticios) para los 8 recursos.
update resources set tags = array['free'], in_person = true                                   where name = 'Hudson County Pet Pantry';
update resources set tags = array['low_cost','income_based','walk_ins'], in_person = true,
  opening_hours = '{"mon":[["09:00","17:00"]],"tue":[["09:00","17:00"]],"wed":[["09:00","17:00"]],"thu":[["09:00","17:00"]],"fri":[["09:00","17:00"]],"sat":[["09:00","13:00"]]}'::jsonb
                                                                                               where name = 'Low-Cost Spay/Neuter Clinic';
update resources set tags = array['income_based'], in_person = false                          where name = 'Emergency Vet Aid Fund';
update resources set tags = array['free'], in_person = false                                  where name = 'Bridge Foster Network';
update resources set tags = array['free'], in_person = false                                  where name = 'Crisis Boarding Program';
update resources set tags = array['free'], in_person = true,
  opening_hours = '{"mon":[["10:00","16:00"]],"tue":[["10:00","16:00"]],"wed":[["10:00","16:00"]],"thu":[["10:00","16:00"]],"fri":[["10:00","16:00"]]}'::jsonb
                                                                                               where name = 'Animal Welfare Legal Aid';
update resources set in_person = true, tags = array['walk_ins'],
  opening_hours = '{"mon":[["10:00","16:00"]],"tue":[["10:00","16:00"]],"wed":[["10:00","16:00"]],"thu":[["10:00","16:00"]],"fri":[["10:00","16:00"]],"sat":[["10:00","16:00"]],"sun":[["10:00","16:00"]]}'::jsonb
                                                                                               where name = 'Riverside Animal Sanctuary';
update resources set tags = array['free'], in_person = true                                   where name = 'Free pet food pantry';

-- 5 · resources_nearby() con las columnas nuevas (mismas que 0013 + is_sample, opening_hours, timezone, tags, in_person).
drop function if exists resources_nearby(double precision, double precision, double precision);
create function resources_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, name text, category resource_category, description text, address text,
  phone text, website_url text, is_featured_event boolean, icon text, hours text,
  event_date date, event_starts_at timestamptz, event_ends_at timestamptz, photo_url text,
  is_sample boolean, opening_hours jsonb, timezone text, tags text[], in_person boolean,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.name, r.category, r.description, r.address, r.phone, r.website_url,
         r.is_featured_event, r.icon, r.hours, r.event_date, r.event_starts_at, r.event_ends_at, r.photo_url,
         r.is_sample, r.opening_hours, r.timezone, r.tags, r.in_person,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from resources r
  where r.location is not null
    and st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by 22;
$$;
grant execute on function resources_nearby(double precision, double precision, double precision) to anon, authenticated;
