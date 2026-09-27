-- seed_demo_reset.sql — regenera los datos de DEMO con fechas relativas a now(). Se puede correr las veces que quieras.
--
-- CUÁNDO CORRERLO: DESPUÉS de aplicar 0009 … 0017 (las reglas de matching y las columnas nuevas ya deben existir) y con tu
-- cuenta ya creada en la app (para que el reporte de Max sea "mío"). Pégalo entero en el SQL Editor y ejecuta Run.
--
-- QUÉ HACE
--   1. Borra SOLO las filas de demo, por ID fijo: los reportes '20000000-0000-0000-0000-0000000000NN' y los del seed antiguo
--      '10000000-0000-0000-0000-00000000000N' (sus coincidencias caen en cascada). No toca nada más: ni tus reportes reales,
--      ni perfiles, ni mascotas, ni recursos.
--   2. Recrea 11 reportes (incl. 'Lazy', segundo Lost tuyo sin coincidencias) con fechas relativas a now(), en direcciones reales de North Bergen / Union City (coordenadas fijas
--      obtenidas con geocoding; el avistamiento Golden se ubica a 320 m de Max para que genere la coincidencia STRONG):
--        Lost      Max (Golden, TUYO, 3 h, 0.4 mi) · Luna (gata Siamese, 30 h, 2.0 mi) · "Bartholomew Maximilian von Schnauzenberg"
--                  (nombre largo, 48 h, 3.2 mi, sin foto) · Whiskers (gato Persian, 80 h, 4.5 mi, sin foto)
--        Sighted   Golden Retriever SIN FOTO (30 min, a 0.2 mi de Max → 'possible': sin foto nunca es strong, 0012) · Golden Retriever CON foto (2 h, 0.4 mi → STRONG para Max) · Beagle mix (1 h, 0.9 mi →
--                  NO coincide con Max: tamaños incompatibles) · gato tabby (6 h, 1.1 mi → 'possible' para Luna) ·
--                  Labrador mix (40 h → NO coincide con Max: es anterior a su pérdida)
--        Reunited  Biscuit (perro Labrador mix, reunido hace 5 h, 1.6 mi)
--   3. Pone la fecha del evento "Free pet food pantry" en el próximo sábado (si la columna event_date existe, 0011) y, si existe
--      alerted_count (0010), un valor de demostración (14) en el Lost de Max. Ese 14 es DATO DE DEMO, no un conteo real.
--
-- NOTIFICACIONES: mientras corre, se desactivan los triggers de push (0005) para que la demo NO mande avisos reales a nadie.
-- Cámbialo con v_send_push. Si ese bloque falla, todo se revierte (incluida la desactivación de triggers).

do $$
declare
  -- ── AJUSTES ───────────────────────────────────────────────────────────────────────────────────────────────────────
  v_me          uuid             := null;   -- tu id en Authentication → Users. null = el perfil real (no demo) creado más recientemente
  v_center_lng  double precision := null;   -- centro de la demo. null = tu ubicación base (profiles.home) o, si no hay, White Plains
  v_center_lat  double precision := null;   --   (solo informativo: las posiciones de los reportes ahora son coordenadas fijas de North Bergen)
  v_event_mode  text             := 'upcoming'; -- estado del evento "Free pet food pantry" (0013): 'upcoming' = próximo sábado 9am–1pm ·
                                                 -- 'live' = en curso ahora (termina en 2 h) · 'later_today' = hoy, empieza en 2 h ·
                                                 -- 'ended' = terminó hace 1 h (debe desaparecer del feed y del mapa)
  v_send_push   boolean          := false;  -- true = deja activos los triggers que envían push reales
  -- ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  demo_owner    constant uuid := '00000000-0000-0000-0000-000000000001';
  demo_reporter constant uuid := '00000000-0000-0000-0000-000000000002';
  me            uuid;
  center        geography;
  max_loc       geography;
  has_alerted   boolean;
  max_pet       uuid;
  lazy_pet      uuid;
  lazy_breed    text;
  lazy_photo    text;
  buddy_pet     uuid;
  has_event     boolean;
begin
  me := coalesce(v_me,
                 (select id from profiles where id not in (demo_owner, demo_reporter) order by created_at desc limit 1),
                 demo_owner);

  if v_center_lng is not null and v_center_lat is not null then
    center := st_makepoint(v_center_lng, v_center_lat)::geography;
  else
    center := coalesce((select home from profiles where id = me), st_makepoint(-73.7629, 41.034)::geography);
  end if;

  -- Usuarios de demo (para los reportes de "otras personas"). No se tocan si ya existen.
  insert into auth.users (id, aud, role, email) values
    (demo_owner,    'authenticated', 'authenticated', 'demo-owner@petbeacon.test'),
    (demo_reporter, 'authenticated', 'authenticated', 'demo-reporter@petbeacon.test')
  on conflict do nothing;
  insert into profiles (id, name, city, alert_radius_mi) values
    (demo_owner,    'Demo Owner',    'Demo City', 5),
    (demo_reporter, 'Demo Reporter', 'Demo City', 5)
  on conflict do nothing;

  -- Sin notificaciones reales durante la demo.
  if not v_send_push then
    if exists (select 1 from pg_trigger where tgname = 'reports_notify_nearby' and tgrelid = 'reports'::regclass) then
      alter table reports disable trigger reports_notify_nearby;
    end if;
    if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
      alter table matches disable trigger matches_notify;
    end if;
  end if;

  -- 1. Borrado SOLO de demo (por ID). Las coincidencias asociadas se eliminan en cascada.
  delete from reports
  where id::text like '20000000-0000-0000-0000-0000000000__'
     or id::text like '10000000-0000-0000-0000-00000000000_';

  -- 1b. Mascotas registradas (Fase 1 de Profile/Pets). Max y Lazy son TUYAS: se reutilizan si ya existen (por nombre) y, si no, se crean.
  select id into max_pet from pets where user_id = me and lower(btrim(name)) = 'max' limit 1;
  if max_pet is null then
    max_pet := '30000000-0000-0000-0000-000000000001';
    insert into pets (id, user_id, name, species, breed, photo_url)
    values (max_pet, me, 'Max', 'dog', 'Golden Retriever', 'https://images.unsplash.com/photo-1552053831-71594a27632d') on conflict (id) do nothing;
  end if;
  select id, breed, photo_url into lazy_pet, lazy_breed, lazy_photo from pets where user_id = me and lower(btrim(name)) = 'lazy' limit 1;
  if lazy_pet is null then
    lazy_pet := '30000000-0000-0000-0000-000000000002'; lazy_breed := 'Pekingese';
    insert into pets (id, user_id, name, species, breed) values (lazy_pet, me, 'Lazy', 'dog', lazy_breed) on conflict (id) do nothing;
  end if;
  -- Buddy: mascota TUYA distinta de Max, solo para el ejemplo de "reunited" del historial (para no reutilizar a Max en dos roles a la vez).
  select id into buddy_pet from pets where user_id = me and lower(btrim(name)) = 'buddy' limit 1;
  if buddy_pet is null then
    buddy_pet := '30000000-0000-0000-0000-000000000007';
    insert into pets (id, user_id, name, species, breed, photo_url)
    values (buddy_pet, me, 'Buddy', 'dog', 'Beagle', 'https://images.unsplash.com/photo-1703721025121-26d64508482b') on conflict (id) do nothing;
  end if;
  -- Mascotas de los usuarios demo (por id fijo; se recrean en cada corrida).
  delete from pets where id::text like '30000000-0000-0000-0000-0000000000__' and user_id in (demo_owner, demo_reporter);
  insert into pets (id, user_id, name, species, breed, photo_url) values
    ('30000000-0000-0000-0000-000000000003', demo_owner, 'Luna', 'cat', 'Siamese cat', 'https://images.unsplash.com/photo-1695708794933-57424f0bf14e'),
    ('30000000-0000-0000-0000-000000000004', demo_owner, 'Bartholomew Maximilian von Schnauzenberg', 'dog', 'Miniature Schnauzer', null),
    ('30000000-0000-0000-0000-000000000005', demo_owner, 'Whiskers', 'cat', 'Persian', null),
    ('30000000-0000-0000-0000-000000000006', demo_owner, 'Biscuit', 'dog', 'Labrador mix', 'https://images.unsplash.com/photo-1585588640338-2c3dc723e638');

  -- 2a. Reportes Lost y Reunited (primero: los avistamientos necesitan que el Lost ya exista para generar coincidencias).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000001', me, 'lost', 'dog', 'Max', 'Golden Retriever',
      'https://images.unsplash.com/photo-1552053831-71594a27632d', 52, 37, 190,
      'Blue collar with a silver tag, limps slightly on his left leg.',
      null,
      st_setsrid(st_makepoint(-74.03518, 40.782693), 4326)::geography, 'Tonnelle Ave & 42nd St, North Bergen', '(201) 555-0100', now() - interval '3 hours', null, max_pet),
    ('20000000-0000-0000-0000-000000000002', demo_owner, 'lost', 'cat', 'Luna', 'Siamese cat',
      'https://images.unsplash.com/photo-1695708794933-57424f0bf14e', 50, 30, 190,
      'Very shy — may not approach strangers, please don''t chase.',
      null,
      st_setsrid(st_makepoint(-74.01639, 40.795797), 4326)::geography, 'Kennedy Blvd & 67th St, North Bergen', 'luna.owner@example.com', now() - interval '30 hours', null, '30000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000003', demo_owner, 'lost', 'dog', 'Bartholomew Maximilian von Schnauzenberg', 'Miniature Schnauzer',
      null, null, null, null,
      'Grey and white beard, answers to Barty. Wearing a red harness.',
      null,
      st_setsrid(st_makepoint(-74.024186, 40.791013), 4326)::geography, 'Meadowview Ave, North Bergen', '(201) 555-0142', now() - interval '48 hours', null, '30000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000004', demo_owner, 'lost', 'cat', 'Whiskers', 'Persian',
      null, null, null, null,
      'Flat-faced, long white fur. Indoor cat that slipped out through the back door.',
      null,
      st_setsrid(st_makepoint(-74.044975, 40.76351), 4326)::geography, 'Paterson Plank Rd, North Bergen', 'whiskers.family@example.com', now() - interval '80 hours', null, '30000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000008', demo_owner, 'reunited', 'dog', 'Biscuit', 'Labrador mix',
      'https://images.unsplash.com/photo-1585588640338-2c3dc723e638', 56, 25, 190,
      'Reunited with owner within 3 hours of the alert going live.',
      null,
      st_setsrid(st_makepoint(-74.022272, 40.781078), 4326)::geography, 'Bergenline Ave & 47th St, Union City', '(201) 555-0100', now() - interval '18 hours', now() - interval '5 hours', '30000000-0000-0000-0000-000000000006');

  -- Lazy (tu mascota registrada): una mascota solo puede tener UN Lost activo (índice único, 0015). Si ya tienes un reporte Lost REAL de Lazy
  -- (creado desde la app), se respeta y NO se añade el de demo.
  if not exists (select 1 from reports where pet_id = lazy_pet and status = 'lost' and id::text not like '20000000-0000-0000-0000-0000000000__') then
    insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000011', me, 'lost', 'dog', 'Lazy', lazy_breed,
      lazy_photo, null, null, null,                                                  -- datos de tu mascota Lazy; sin coincidencias (perro pequeño: incompatible por tamaño con los avistamientos)
      'Small and fluffy with a flat face. Wears a green collar.',
      null,
      st_setsrid(st_makepoint(-74.018217, 40.786395), 4326)::geography, 'Bergenline Ave & 56th St, West New York', '(201) 555-0100', now() - interval '20 hours', null, lazy_pet);
  end if;

  select location into max_loc from reports where id = '20000000-0000-0000-0000-000000000001';

  -- 2b. Avistamientos (el trigger de matching los cruza con los Lost de arriba).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at) values
    ('20000000-0000-0000-0000-000000000005', demo_reporter, 'sighted', 'dog', null, 'Golden Retriever',
      null, null, null, null,                                                        -- SIN FOTO a propósito (muestra la silueta)
      'Golden coat, blue collar. Stayed near the park entrance and let people approach.',
      'calm',
      st_project(max_loc, 320, radians(60))::geography, 'Near Tonnelle Ave & 42nd St, North Bergen', null, now() - interval '30 minutes', null),
    ('20000000-0000-0000-0000-000000000010', demo_reporter, 'sighted', 'dog', null, 'Golden Retriever',
      'https://images.unsplash.com/photo-1611250282006-4484dd3fba6b', 60, 30, 150,   -- CON foto: la única coincidencia 'strong' de Max
      'Golden puppy-like dog with a blue collar, very friendly.',
      'calm',
      st_project(max_loc, 700, radians(200))::geography, 'Near Tonnelle Ave & 38th St, North Bergen', null, now() - interval '2 hours', null),
    ('20000000-0000-0000-0000-000000000006', demo_reporter, 'sighted', 'dog', null, 'Beagle mix',
      'https://images.unsplash.com/photo-1703721025121-26d64508482b', 28, 46, 150,
      'No collar visible. Friendly, approached the reporter calmly.',
      'calm',
      st_setsrid(st_makepoint(-74.022914, 40.78319), 4326)::geography, 'Kennedy Blvd & 50th St, West New York', null, now() - interval '1 hour', null),
    ('20000000-0000-0000-0000-000000000007', demo_reporter, 'sighted', 'cat', null, 'Domestic shorthair, gray tabby',
      'https://images.unsplash.com/photo-1557735802-ef14538b00a4', 43, 35, 240,
      'Skittish — seen hiding under a porch, did not approach.',
      'scared',
      st_setsrid(st_makepoint(-74.014293, 40.799959), 4326)::geography, 'Kennedy Blvd & 73rd St, North Bergen', null, now() - interval '6 hours', null),
    ('20000000-0000-0000-0000-000000000009', demo_reporter, 'sighted', 'dog', null, 'Labrador mix',
      null, null, null, null,
      'Black lab mix, no collar, drinking from a puddle.',
      'unsure',
      st_setsrid(st_makepoint(-74.011318, 40.795557), 4326)::geography, 'Bergenline Ave & 69th St, West New York', null, now() - interval '40 hours', null);

  -- 3. Evento con fecha concreta (0011) y conteo de demostración (0010), solo si esas columnas existen.
  select exists (select 1 from information_schema.columns where table_name = 'resources' and column_name = 'event_date') into has_event;
  if has_event then
    execute $q$update resources set event_date = current_date + ((6 - extract(dow from current_date)::int + 7) % 7)
               where name = 'Free pet food pantry'$q$;
  end if;
  -- Horas del evento (0013), solo si esas columnas existen. Las horas 'live' / 'later_today' / 'ended' se fijan respecto a ahora.
  if exists (select 1 from information_schema.columns where table_name = 'resources' and column_name = 'event_ends_at') then
    if v_event_mode = 'live' then
      update resources set event_date = current_date, event_starts_at = now() - interval '1 hour', event_ends_at = now() + interval '2 hours' where name = 'Free pet food pantry';
    elsif v_event_mode = 'later_today' then
      update resources set event_date = current_date, event_starts_at = now() + interval '2 hours', event_ends_at = now() + interval '5 hours' where name = 'Free pet food pantry';
    elsif v_event_mode = 'ended' then
      update resources set event_date = current_date, event_starts_at = now() - interval '4 hours', event_ends_at = now() - interval '1 hour' where name = 'Free pet food pantry';
    else
      update resources set event_starts_at = (event_date::timestamp + time '09:00') at time zone 'America/New_York',
                           event_ends_at   = (event_date::timestamp + time '13:00') at time zone 'America/New_York' where name = 'Free pet food pantry';
    end if;
  end if;
  select exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'alerted_count') into has_alerted;
  if has_alerted then
    execute $q$update reports set alerted_count = 14 where id = '20000000-0000-0000-0000-000000000001'$q$;
  end if;

  -- 4. (mudanza a North Bergen) Borra los reportes de prueba Lost 'Lazy', 'Champion' y 'Firulai' (por ID exacto; coincidencias en cascada).
  delete from reports where id in (
    '15739402-f80e-43f0-ab66-b0be4e1b8b53',   -- Lazy (Lost)
    '8137f61b-280e-4005-8f48-c61a29c1e7ca',   -- Champion (Lost)
    '958e0dd3-27e7-4397-bd00-1dfe2112da19');  -- Firulai (Lost)

  -- 5. Recursos de Support and care en el área de North Bergen (por nombre actual o ya renombrado; se puede repetir).
  update resources r set name = v.new_name, address = v.addr, location = st_setsrid(st_makepoint(v.lng, v.lat), 4326)::geography,
                         phone = v.phone, website_url = v.web
  from (values
    ('Westchester Pet Pantry',         'Hudson County Pet Pantry',      '4500 Bergenline Ave, Union City, NJ',        -74.023366, 40.779477, '(201) 555-0142', 'hudsoncountypetpantry.org'),
    ('Low-Cost Spay/Neuter Clinic',    'Low-Cost Spay/Neuter Clinic',   '7601 JFK Blvd, North Bergen, NJ',            -74.012897, 40.802517, '(201) 555-0188', 'lowcostspayneuter.org'),
    ('Emergency Vet Aid Fund',         'Emergency Vet Aid Fund',        '3600 JFK Blvd, Union City, NJ',              -74.029895, 40.775575, '(201) 555-0121', 'vetaidfund.org'),
    ('Bridge Foster Network',          'Bridge Foster Network',         '1300 Tonnelle Ave, North Bergen, NJ',        -74.047203, 40.764342, '(201) 555-0156', 'bridgefosternetwork.org'),
    ('Crisis Boarding Program',        'Crisis Boarding Program',       '7001 Tonnelle Ave, North Bergen, NJ',        -74.020718, 40.802164, '(201) 555-0119', 'crisisboarding.org'),
    ('Animal Welfare Legal Aid',       'Animal Welfare Legal Aid',      '6800 Bergenline Ave, Guttenberg, NJ',        -74.01161,  40.79482,  '(201) 555-0301', 'animalwelfarelegalaid.org'),
    ('Riverside Animal Sanctuary',     'Riverside Animal Sanctuary',    '2300 JFK Blvd, Union City, NJ',              -74.03833,  40.76972,  '(201) 555-0177', 'riversideanimalsanctuary.org'),
    ('Free pet food pantry',           'Free pet food pantry',          'Community Hall, Tonnelle Ave & 51st St, North Bergen, NJ', -74.030946, 40.787819, '(201) 555-0110', 'hudsoncountypetpantry.org/pantry')
  ) as v(old_name, new_name, addr, lng, lat, phone, web)
  where r.name in (v.old_name, v.new_name);

  -- 6. Razas canónicas (0016) y color/tamaño (0017), solo si esas migraciones ya se aplicaron. Luego se recalculan las coincidencias de los Lost.
  if exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'breed_id') then
    execute $q$update reports set breed_id = map_breed_or_mixed(breed, species) where id::text like '20000000-0000-0000-0000-0000000000__'$q$;
    execute $q$update pets set breed_id = map_breed_or_mixed(breed, species) where breed_id is null and breed is not null and user_id in ($1, $2)$q$ using me, demo_owner;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'pets' and column_name = 'color') then
    -- Max (Golden, grande) y Lazy (crema, pequeña); el Golden con foto también es dorado y grande, así que su coincidencia sigue siendo 'strong'.
    execute $q$update pets set color = 'golden', size = 'large' where id = $1$q$ using max_pet;
    execute $q$update pets set color = 'cream', size = 'small' where id = $1$q$ using lazy_pet;
    execute $q$update reports set color = 'golden', size = 'large' where id in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000010')$q$;
    execute $q$update reports set color = 'cream', size = 'small' where id = '20000000-0000-0000-0000-000000000011'$q$;
  end if;
  if exists (select 1 from pg_proc where proname = 'recompute_matches_for_lost') then
    perform recompute_matches_for_lost(id) from reports where id::text like '20000000-0000-0000-0000-0000000000__' and status = 'lost';
  end if;

  -- 7. Reportes PROPIOS para probar My Reports (fase 4): dos avistamientos tuyos (uno vigente y otro ya vencido), un Lost anterior de Max ya
  --    reunido (Buddy, para no repetir a Max) y, si la migración 0020 existe, un avistamiento resuelto y otro con "Still there".
  insert into reports (id, user_id, status, species, name, breed, photo_url, features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000012', me, 'sighted', 'dog', null, 'Siberian Husky', null, 'Blue eyes, no collar, trotting along the sidewalk.', 'calm',
      st_setsrid(st_makepoint(-74.030, 40.7755), 4326)::geography, 'Bergenline Ave & 40th St, Union City, NJ 07087, United States', null, now() - interval '5 hours', null, null),
    ('20000000-0000-0000-0000-000000000013', me, 'sighted', 'cat', null, 'Domestic Shorthair', null, 'Black cat near the trash bins.', 'scared',
      st_setsrid(st_makepoint(-74.0285, 40.7810), 4326)::geography, 'Palisade Ave, Union City', null, now() - interval '60 hours', null, null),
    ('20000000-0000-0000-0000-000000000016', me, 'reunited', 'dog', 'Buddy', 'Beagle', 'https://images.unsplash.com/photo-1703721025121-26d64508482b', 'Found two blocks away, safe and sound.', null,
      st_setsrid(st_makepoint(-74.0335, 40.7803), 4326)::geography, 'Tonnelle Ave & 42nd St, North Bergen, NJ 07047, United States', '(201) 555-0100', now() - interval '6 days', now() - interval '3 days', buddy_pet);
  if exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'resolution') then
    execute $q$insert into reports (id, user_id, status, species, breed, features_description, condition, location, location_label, created_at, resolution, resolved_at) values
      ('20000000-0000-0000-0000-000000000014', $1, 'resolved', 'cat', 'Siamese', 'Was wearing a red collar.', 'calm',
       st_setsrid(st_makepoint(-74.0210, 40.7790), 4326)::geography, 'Bergenline Ave & 47th St, Union City', now() - interval '4 days', 'returned_to_owner', now() - interval '2 days')$q$ using me;
    execute $q$update reports set last_seen_at = now() - interval '25 minutes' where id = '20000000-0000-0000-0000-000000000012'$q$;
  end if;

  -- Reactiva los triggers de push.
  if not v_send_push then
    if exists (select 1 from pg_trigger where tgname = 'reports_notify_nearby' and tgrelid = 'reports'::regclass) then
      alter table reports enable trigger reports_notify_nearby;
    end if;
    if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
      alter table matches enable trigger matches_notify;
    end if;
  end if;

  raise notice 'Demo regenerada. Max es del usuario % · centro: % · coincidencias creadas para Max: %',
    me, st_astext(center::geometry),
    (select count(*) from matches where lost_report_id = '20000000-0000-0000-0000-000000000001');
end $$;
