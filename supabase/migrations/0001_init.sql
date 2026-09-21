-- PetBeacon — esquema inicial (CLAUDE.md §4 y §6)
create extension if not exists postgis;

create type report_status  as enum ('lost', 'sighted', 'reunited');
create type species_type   as enum ('dog', 'cat', 'other');
create type resource_category as enum ('food', 'foster', 'legal');
create type match_confidence as enum ('possible', 'strong');

-- Usuarios: 1-a-1 con auth.users (auth anónima al inicio; Signup = nombre + ciudad)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  city text not null,
  alert_radius_mi int not null default 5 check (alert_radius_mi between 1 and 10),
  push_notifications_enabled boolean not null default true,
  email_notifications_enabled boolean not null default false,
  push_token text,
  home geography(point, 4326),
  created_at timestamptz not null default now()
);

create table pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  species species_type not null,
  breed text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- Report: Lost y Sighted comparten tabla; `status` distingue (reunited = cierre de un Lost)
create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  status report_status not null,
  species species_type not null,
  name text,                         -- opcional en Sighted
  breed text,
  photo_url text,
  features_description text,
  location geography(point, 4326) not null,
  location_label text,               -- dirección manual / geocodificada
  contact_phone_or_email text,       -- obligatorio si lost, opcional si sighted
  pet_id uuid references pets(id) on delete set null,
  matched_report_id uuid references reports(id) on delete set null,
  created_at timestamptz not null default now(),
  reunited_at timestamptz,
  constraint lost_requires_contact check (status <> 'lost' or contact_phone_or_email is not null),
  constraint reunited_has_timestamp check (status <> 'reunited' or reunited_at is not null)
);
create index reports_location_idx on reports using gist (location);
create index reports_status_created_idx on reports (status, created_at desc);

create table resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category resource_category not null,
  description text not null,
  address text,
  location geography(point, 4326),
  phone text,
  whatsapp text,
  website_url text,
  is_featured_event boolean not null default false,
  icon text,
  created_at timestamptz not null default now()
);
create index resources_location_idx on resources using gist (location);

-- Matches automáticos (§6). Al descartar el banner, `dismissed` pasa a badge en My Reports.
create table matches (
  id uuid primary key default gen_random_uuid(),
  lost_report_id uuid not null references reports(id) on delete cascade,
  sighted_report_id uuid not null references reports(id) on delete cascade,
  confidence match_confidence not null,
  dismissed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (lost_report_id, sighted_report_id)
);

-- Retención del feed (§6): Lost nunca expira; Sighted 48h; Reunited 24h.
create view active_reports as
select * from reports
where status = 'lost'
   or (status = 'sighted' and created_at > now() - interval '48 hours')
   or (status = 'reunited' and reunited_at > now() - interval '24 hours');

-- Consulta del feed / mapa: filtra por radio real (req. 5.4).
create or replace function reports_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, status report_status, species species_type, name text, breed text, photo_url text,
  features_description text, location_label text, created_at timestamptz,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.status, r.species, r.name, r.breed, r.photo_url, r.features_description,
         r.location_label, r.created_at,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from active_reports r
  where st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by
    -- Lost primero durante las primeras 72h, luego por recencia
    (r.status = 'lost' and r.created_at > now() - interval '72 hours') desc,
    r.created_at desc;
$$;

-- Matching estricto (§6): especie exacta, dentro del radio del dueño, solo contra Lost activos.
-- La raza refuerza la confianza (strong) pero no filtra.
create or replace function match_new_sighting() returns trigger language plpgsql security definer as $$
begin
  if new.status <> 'sighted' then return new; end if;
  insert into matches (lost_report_id, sighted_report_id, confidence)
  select l.id, new.id,
         case when l.breed is not null and new.breed is not null
                   and lower(l.breed) = lower(new.breed) then 'strong'::match_confidence
              else 'possible'::match_confidence end
  from reports l
  join profiles p on p.id = l.user_id
  where l.status = 'lost'
    and l.species = new.species
    and st_dwithin(l.location, new.location, p.alert_radius_mi * 1609.344)
  on conflict do nothing;
  return new;
end $$;

create trigger reports_match_after_insert
after insert on reports for each row execute function match_new_sighting();

-- RLS
alter table profiles  enable row level security;
alter table pets      enable row level security;
alter table reports   enable row level security;
alter table resources enable row level security;
alter table matches   enable row level security;

create policy "own profile"  on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "own pets"     on pets     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "reports readable" on reports for select using (true);
create policy "own reports insert" on reports for insert with check (user_id = auth.uid());
create policy "own reports update" on reports for update using (user_id = auth.uid());
create policy "own reports delete" on reports for delete using (user_id = auth.uid());
create policy "resources readable" on resources for select using (true);
create policy "own matches" on matches for all
  using (exists (select 1 from reports r where r.id = lost_report_id and r.user_id = auth.uid()));
