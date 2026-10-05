-- seed_demo_reset.sql — regenera los datos de DEMO con fechas relativas a now(). Se puede correr las veces que quieras.
--
-- CUÁNDO CORRERLO: DESPUÉS de aplicar 0009 … 0017 y 0023 (las reglas de matching, las columnas de color/tamaño y el punto
-- focal de pets ya deben existir) y con tu cuenta ya creada en la app (para que el reporte de Max sea "mío"). Pégalo
-- entero en el SQL Editor y ejecuta Run. Después corre seed_edge_cases.sql (reportes propios adicionales, en archivo
-- aparte — comparten el prefijo de ID de demo, así que si corres este script solo, esos reportes desaparecen hasta
-- que vuelvas a correr seed_edge_cases.sql; es esperado).
--
-- FOTOS (2026-09-29): todas las fichas de este archivo tienen foto real, alojada en Supabase Storage
-- (report-photos/demo/, no hotlink externo — ver PHOTO_CREDITS.md para la atribución de cada una). El único caso SIN
-- foto que queda en todo el seed (silueta de gato en Past reports) vive en seed_edge_cases.sql, a propósito.
--
-- VIGENCIA (reglas de la app, no se tocan aquí): un avistamiento vive 48 h desde su última actividad, un reunido 24 h
-- desde su cierre, un Lost no vence, y un evento vence al pasar su hora de fin. Todo lo de este script es relativo a now(),
-- así que SE VUELVE A CORRER antes de cada sesión de capturas: los datos "envejecen" con el reloj, no por una fecha fija.
--
-- QUÉ HACE
--   1. Borra SOLO las filas de demo, por ID fijo: los reportes '20000000-0000-0000-0000-0000000000NN' y los del seed antiguo
--      '10000000-0000-0000-0000-00000000000N' (sus coincidencias caen en cascada). No toca nada más: ni tus reportes reales,
--      ni perfiles, ni mascotas, ni recursos.
--   2. Recrea 11 reportes (incl. 'Lazy', segundo Lost tuyo sin coincidencias) con fechas relativas a now(), en direcciones reales de North Bergen / Union City (coordenadas fijas
--      obtenidas con geocoding; los avistamientos Golden se ubican cerca de Max para que generen coincidencia STRONG):
--        Lost      Max (Golden, TUYO, 3 h, 0.4 mi) · Luna (gata Siamese, 30 h, 2.0 mi) · Bartholomew Maximilian von
--                  Schnauzenberg (Miniature Schnauzer, 48 h, 3.2 mi) · Whiskers (gatita Persian, 80 h, 4.5 mi)
--        Sighted   Golden Retriever #1 (30 min, 0.2 mi de Max → STRONG) · Golden Retriever #2 (2 h, 0.4 mi → STRONG
--                  también) · Beagle mix (1 h, 0.9 mi → NO coincide con Max: tamaños incompatibles) · gato tabby
--                  (26 h, 1.1 mi → 'possible' para Luna: raza distinta) · Labrador mix (30 h → NO coincide con Max: es
--                  anterior a su pérdida)
--        Reunited  Biscuit (perro Labrador mix, reunido hace 2 h, 1.6 mi)
--   3. Pone la fecha del evento "Free microchip day" en el próximo sábado (si la columna event_date existe, 0011) y, si existe
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
  v_event_mode  text             := 'upcoming'; -- estado del evento "Free microchip day" (0013): 'upcoming' = próximo sábado 9am–1pm ·
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
  select id, breed into lazy_pet, lazy_breed from pets where user_id = me and lower(btrim(name)) = 'lazy' limit 1;
  if lazy_pet is null then
    lazy_pet := '30000000-0000-0000-0000-000000000002'; lazy_breed := 'Pekingese';
    insert into pets (id, user_id, name, species, breed) values (lazy_pet, me, 'Lazy', 'dog', lazy_breed) on conflict (id) do nothing;
  end if;
  -- Foto real de Lazy (2026-09-29, reemplaza cualquier foto anterior, incluida la de marca de agua de Adobe Stock —
  -- PHOTO_CREDITS.md). Su cara está en el tercio izquierdo de la foto (composición horizontal), por eso el punto focal
  -- no es el default (50, 30): sin esto, el recorte cuadrado de Profile le cortaría la cara.
  update pets set
    photo_url = 'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/lazy-pekingese.jpg',
    photo_focus_x = 28, photo_focus_y = 36, photo_zoom = 200
  where id = lazy_pet;
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
    ('30000000-0000-0000-0000-000000000004', demo_owner, 'Bartholomew Maximilian von Schnauzenberg', 'dog', 'Miniature Schnauzer',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/bartholomew-schnauzer.jpg'),
    ('30000000-0000-0000-0000-000000000005', demo_owner, 'Whiskers', 'cat', 'Persian',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/whiskers-persian-kitten.jpg'),
    ('30000000-0000-0000-0000-000000000006', demo_owner, 'Biscuit', 'dog', 'Labrador mix', 'https://images.unsplash.com/photo-1585588640338-2c3dc723e638');
  update pets set photo_focus_x = 48, photo_focus_y = 26, photo_zoom = 190 where id = '30000000-0000-0000-0000-000000000004'; -- Bartholomew
  update pets set photo_focus_x = 31, photo_focus_y = 47, photo_zoom = 190 where id = '30000000-0000-0000-0000-000000000005'; -- Whiskers
  update pets set photo_focus_x = 46, photo_focus_y = 38 where id = '30000000-0000-0000-0000-000000000003'; -- Luna
  update pets set photo_focus_x = 56, photo_focus_y = 25 where id = '30000000-0000-0000-0000-000000000006'; -- Biscuit
  update pets set photo_focus_x = 52, photo_focus_y = 37 where id = max_pet; -- Max
  update pets set photo_focus_x = 30, photo_focus_y = 45 where id = buddy_pet; -- Buddy (misma foto que el avistamiento "Beagle mix")

  -- 2a. Reportes Lost y Reunited (primero: los avistamientos necesitan que el Lost ya exista para generar coincidencias).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000001', me, 'lost', 'dog', 'Max', 'Golden Retriever',
      'https://images.unsplash.com/photo-1552053831-71594a27632d', 52, 37, 190,
      'Blue collar with a silver tag, limps slightly on his left leg.',
      null,
      st_setsrid(st_makepoint(-74.03518, 40.782693), 4326)::geography, 'Tonnelle Ave & 42nd St, North Bergen', '(201) 555-0100', now() - interval '3 hours', null, max_pet),
    ('20000000-0000-0000-0000-000000000002', demo_owner, 'lost', 'cat', 'Luna', 'Siamese cat',
      'https://images.unsplash.com/photo-1695708794933-57424f0bf14e', 46, 38, 190,
      'Very shy — may not approach strangers, please don''t chase.',
      null,
      st_setsrid(st_makepoint(-74.01639, 40.795797), 4326)::geography, 'Kennedy Blvd & 67th St, North Bergen', 'luna.owner@example.com', now() - interval '30 hours', null, '30000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000003', demo_owner, 'lost', 'dog', 'Bartholomew Maximilian von Schnauzenberg', 'Miniature Schnauzer',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/bartholomew-schnauzer.jpg', 48, 26, 190,
      'Answers to Barty. Wearing a red harness.',
      null,
      st_setsrid(st_makepoint(-74.024186, 40.791013), 4326)::geography, 'Meadowview Ave, North Bergen', '(201) 555-0142', now() - interval '48 hours', null, '30000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000004', demo_owner, 'lost', 'cat', 'Whiskers', 'Persian',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/whiskers-persian-kitten.jpg', 31, 47, 190,
      'Flat-faced, long white fur. Indoor cat that slipped out through the back door.',
      null,
      st_setsrid(st_makepoint(-74.044975, 40.76351), 4326)::geography, 'Paterson Plank Rd, North Bergen', 'whiskers.family@example.com', now() - interval '80 hours', null, '30000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000008', demo_owner, 'reunited', 'dog', 'Biscuit', 'Labrador mix',
      'https://images.unsplash.com/photo-1585588640338-2c3dc723e638', 56, 25, 190,
      'Reunited with owner within 3 hours of the alert going live.',
      null,
      st_setsrid(st_makepoint(-74.022272, 40.781078), 4326)::geography, 'Bergenline Ave & 47th St, Union City', '(201) 555-0100', now() - interval '5 hours', now() - interval '2 hours', '30000000-0000-0000-0000-000000000006');

  -- Lazy (tu mascota registrada): una mascota solo puede tener UN Lost activo (índice único, 0015). Si ya tienes un reporte Lost REAL de Lazy
  -- (creado desde la app), se respeta y NO se añade el de demo — ese reporte real no se toca (ni su foto ni su color).
  if not exists (select 1 from reports where pet_id = lazy_pet and status = 'lost' and id::text not like '20000000-0000-0000-0000-0000000000__') then
    insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000011', me, 'lost', 'dog', 'Lazy', lazy_breed,
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/lazy-pekingese.jpg', 28, 36, 200,
      'Small and fluffy with a flat face. Wears a green collar.',
      null,
      st_setsrid(st_makepoint(-74.018217, 40.786395), 4326)::geography, 'Bergenline Ave & 56th St, West New York', '(201) 555-0100', now() - interval '20 hours', null, lazy_pet);
  end if;

  select location into max_loc from reports where id = '20000000-0000-0000-0000-000000000001';

  -- 2b. Avistamientos (el trigger de matching los cruza con los Lost de arriba). Los dos Golden ya tienen foto,
  -- así que ambos pueden dar coincidencia 'strong' con Max (0012 + 0017: raza idéntica + foto + sin color/tamaño en contra).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at) values
    ('20000000-0000-0000-0000-000000000005', demo_reporter, 'sighted', 'dog', null, 'Golden Retriever',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/golden-retriever-match-max.jpg', 56, 38, 140,
      'Golden coat, black harness. Stayed near the park entrance and let people approach.',
      'calm',
      st_project(max_loc, 320, radians(60))::geography, 'Near Tonnelle Ave & 42nd St, North Bergen', null, now() - interval '30 minutes', null),
    ('20000000-0000-0000-0000-000000000010', demo_reporter, 'sighted', 'dog', null, 'Golden Retriever',
      'https://images.unsplash.com/photo-1611250282006-4484dd3fba6b', 60, 12, 150,
      'Golden puppy-like dog with a blue collar, very friendly.',
      'calm',
      st_project(max_loc, 700, radians(200))::geography, 'Near Tonnelle Ave & 38th St, North Bergen', null, now() - interval '2 hours', null),
    ('20000000-0000-0000-0000-000000000006', demo_reporter, 'sighted', 'dog', null, 'Beagle mix',
      'https://images.unsplash.com/photo-1703721025121-26d64508482b', 28, 46, 150,
      'No collar visible. Friendly, approached the reporter calmly.',
      'calm',
      st_setsrid(st_makepoint(-74.022914, 40.78319), 4326)::geography, 'Kennedy Blvd & 50th St, West New York', null, now() - interval '1 hour', null),
    ('20000000-0000-0000-0000-000000000007', demo_reporter, 'sighted', 'cat', null, 'Domestic Shorthair',
      'https://images.unsplash.com/photo-1557735802-ef14538b00a4', 43, 35, 240,
      'Skittish — seen hiding under a porch, did not approach.',
      'scared',
      st_setsrid(st_makepoint(-74.014293, 40.799959), 4326)::geography, 'Kennedy Blvd & 73rd St, North Bergen', null, now() - interval '26 hours', null),
    ('20000000-0000-0000-0000-000000000009', demo_reporter, 'sighted', 'dog', null, 'Labrador mix',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/labrador-mix-sighting.jpg', 52, 21, 210,
      'Black lab mix wearing a collar, no tag visible, drinking from a puddle.',
      'unsure',
      st_setsrid(st_makepoint(-74.011318, 40.795557), 4326)::geography, 'Bergenline Ave & 69th St, West New York', null, now() - interval '30 hours', null);

  -- 3. Evento con fecha concreta (0011) y conteo de demostración (0010), solo si esas columnas existen.
  select exists (select 1 from information_schema.columns where table_name = 'resources' and column_name = 'event_date') into has_event;
  if has_event then
    -- Próximo sábado ESTRICTAMENTE posterior a hoy (si hoy es sábado, el de la semana siguiente) y con "hoy" en hora de Nueva York,
    -- que es la zona del evento (event_starts_at/ends_at, abajo) — Supabase corre en UTC y de noche daría el sábado equivocado.
    execute $q$update resources
               set event_date = (now() at time zone 'America/New_York')::date
                                + (((6 - extract(dow from (now() at time zone 'America/New_York'))::int + 6) % 7) + 1)
               where name in ('Free pet food pantry', 'Free microchip day')$q$;
  end if;
  -- Horas del evento (0013), solo si esas columnas existen. Las horas 'live' / 'later_today' / 'ended' se fijan respecto a ahora.
  if exists (select 1 from information_schema.columns where table_name = 'resources' and column_name = 'event_ends_at') then
    if v_event_mode = 'live' then
      update resources set event_date = (now() at time zone 'America/New_York')::date, event_starts_at = now() - interval '1 hour', event_ends_at = now() + interval '2 hours' where name in ('Free pet food pantry', 'Free microchip day');
    elsif v_event_mode = 'later_today' then
      update resources set event_date = (now() at time zone 'America/New_York')::date, event_starts_at = now() + interval '2 hours', event_ends_at = now() + interval '5 hours' where name in ('Free pet food pantry', 'Free microchip day');
    elsif v_event_mode = 'ended' then
      update resources set event_date = (now() at time zone 'America/New_York')::date, event_starts_at = now() - interval '4 hours', event_ends_at = now() - interval '1 hour' where name in ('Free pet food pantry', 'Free microchip day');
    else
      update resources set event_starts_at = (event_date::timestamp + time '09:00') at time zone 'America/New_York',
                           event_ends_at   = (event_date::timestamp + time '13:00') at time zone 'America/New_York' where name in ('Free pet food pantry', 'Free microchip day');
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
    ('Westchester Pet Pantry',         'Hudson County Pet Pantry',      '4500 Bergenline Ave, Union City, NJ',        -74.023366, 40.779477, '(201) 555-0142', 'hudson-county-pet-pantry.example.org'),
    ('Low-Cost Spay/Neuter Clinic',    'Low-Cost Spay/Neuter Clinic',   '7601 JFK Blvd, North Bergen, NJ',            -74.012897, 40.802517, '(201) 555-0188', 'low-cost-spay-neuter.example.org'),
    ('Emergency Vet Aid Fund',         'Emergency Vet Aid Fund',        '3600 JFK Blvd, Union City, NJ',              -74.029895, 40.775575, '(201) 555-0121', 'vet-aid-fund.example.org'),
    ('Bridge Foster Network',          'Bridge Foster Network',         '1300 Tonnelle Ave, North Bergen, NJ',        -74.047203, 40.764342, '(201) 555-0156', 'bridge-foster-network.example.org'),
    ('Crisis Boarding Program',        'Crisis Boarding Program',       '7001 Tonnelle Ave, North Bergen, NJ',        -74.020718, 40.802164, '(201) 555-0119', 'crisis-boarding.example.org'),
    ('Animal Welfare Legal Aid',       'Animal Welfare Legal Aid',      '6800 Bergenline Ave, Guttenberg, NJ',        -74.01161,  40.79482,  '(201) 555-0301', 'animal-welfare-legal-aid.example.org'),
    ('Riverside Animal Sanctuary',     'Riverside Animal Sanctuary',    '2300 JFK Blvd, Union City, NJ',              -74.03833,  40.76972,  '(201) 555-0177', 'riverside-animal-sanctuary.example.org'),
    ('Free pet food pantry',           'Free microchip day',            'Community Hall, Tonnelle Ave & 51st St, North Bergen, NJ', -74.030946, 40.787819, '(201) 555-0199', 'free-microchip-day.example.org')
  ) as v(old_name, new_name, addr, lng, lat, phone, web)
  where r.name in (v.old_name, v.new_name);

  -- 5a. Ícono del evento (fase de congelación, Fase 8): antes compartía dominio y teléfono con Hudson County Pet Pantry
  -- (mismo recurso duplicado dos veces) — ahora es un evento propio, "Free microchip day", con su propio marcador de
  -- contacto (igual patrón ficticio que el resto: teléfono 555 + dominio *.example.org, reservado por RFC 2606 — nunca
  -- resuelve a un sitio real) y un ícono de clínica, no el genérico de food.
  update resources set icon = 'heart-pulse' where name in ('Free pet food pantry', 'Free microchip day');

  -- 5b. Descripciones limpias (evaluación UX): sin repetir lo que ya dicen las etiquetas de costo/acceso (tags, migración 0022).
  --     Solo los 4 casos donde la descripción original repetía "free"/"walk-ins"/etc. palabra por palabra; el resto ya aportaba algo distinto.
  update resources set description = 'Pet food distribution, first Saturday of every month.'
    where name = 'Hudson County Pet Pantry';
  update resources set description = 'Spay and neuter surgery for dogs and cats, performed by licensed veterinarians.'
    where name = 'Low-Cost Spay/Neuter Clinic';
  update resources set description = 'Up to 30 days of boarding while you get back on your feet.'
    where name = 'Crisis Boarding Program';
  update resources set description = 'Consultations on housing and pet-related legal questions.'
    where name = 'Animal Welfare Legal Aid';
  -- Riverside Animal Sanctuary: descripción acortada a una línea y media. En iOS la original ("Verified no-kill shelter with
  -- surrender counseling before intake.") se pintaba cortada a media palabra en la tarjeta de Support (ver CLAUDE.md,
  -- CardDescription); con el texto corto no depende de que el truncado de 2 líneas funcione.
  update resources set description = 'No-kill shelter with surrender counseling.'
    where name = 'Riverside Animal Sanctuary';
  -- "Free microchip day" (Fase 8): descripción exacta del ticket, y tags/in_person por si esta fila viene de una
  -- instalación vieja (seed.sql ya la crea con el nombre nuevo, pero la migración 0022 solo mapeó por el nombre
  -- viejo cuando se aplicó — esto lo deja bien sin importar cuándo se creó la fila).
  update resources set description = 'Free microchipping and registration for dogs and cats. No appointment needed.'
    where name = 'Free microchip day';
  if exists (select 1 from information_schema.columns where table_name = 'resources' and column_name = 'tags') then
    update resources set tags = array['free'], in_person = true where name = 'Free microchip day';
  end if;

  -- 6. Razas canónicas (0016) y color/tamaño (0017), solo si esas migraciones ya se aplicaron. Luego se recalculan las coincidencias de los Lost.
  if exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'breed_id') then
    execute $q$update reports set breed_id = map_breed_or_mixed(breed, species) where id::text like '20000000-0000-0000-0000-0000000000__'$q$;
    execute $q$update pets set breed_id = map_breed_or_mixed(breed, species) where breed_id is null and breed is not null and user_id in ($1, $2)$q$ using me, demo_owner;
  end if;
  if exists (select 1 from information_schema.columns where table_name = 'pets' and column_name = 'color') then
    -- Color y tamaño de CADA mascota del seed, verificados contra su foto real (evaluación UX): tamaño según su peso típico en
    -- breed_sizes (≤11 kg small, ≤27 kg medium, >27 kg large; gatos sin peso → medium, criterio propio). Max (Golden, foto dorada,
    -- grande) y el Golden con foto ya existente (...010) también dorado y grande, así que su coincidencia sigue siendo 'strong'.
    -- El otro Golden (...005) se deja sin color/tamaño (igual que el resto de los avistamientos): igual da 'strong' porque
    -- match_confidence_for() solo bloquea por color/tamaño cuando AMBOS lados los conocen, y aquí el avistamiento no los tiene.
    execute $q$update pets set color = 'golden', size = 'large' where id = $1$q$ using max_pet;
    -- Lazy es CREMA en su foto real de Unsplash (2026-09-29) — su foto anterior, con marca de agua de Adobe Stock, mostraba
    -- un perro negro (de ahí que antes dijera 'black').
    execute $q$update pets set color = 'cream', size = 'small' where id = $1$q$ using lazy_pet;
    execute $q$update pets set color = 'multicolor', size = 'small' where id = $1$q$ using buddy_pet;
    execute $q$update pets set color = 'cream',  size = 'medium' where id = '30000000-0000-0000-0000-000000000003'$q$; -- Luna, Siamese (seal-point, cuerpo claro)
    execute $q$update pets set color = 'black',  size = 'small'  where id = '30000000-0000-0000-0000-000000000004'$q$; -- Bartholomew, Miniature Schnauzer (negro en su foto real; antes decía 'gray' sin tener foto)
    execute $q$update pets set color = 'white',  size = 'small'  where id = '30000000-0000-0000-0000-000000000005'$q$; -- Whiskers, Persian (gatita joven en su foto real; antes 'medium' sin tener foto)
    execute $q$update pets set color = 'cream',  size = 'large'  where id = '30000000-0000-0000-0000-000000000006'$q$; -- Biscuit, Labrador mix (amarillo claro en su foto)

    execute $q$update reports set color = 'golden', size = 'large'  where id in ('20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000010')$q$; -- Max + el Golden con foto (existente)
    execute $q$update reports set color = 'cream',  size = 'medium' where id = '20000000-0000-0000-0000-000000000002'$q$; -- Luna
    execute $q$update reports set color = 'black',  size = 'small'  where id = '20000000-0000-0000-0000-000000000003'$q$; -- Bartholomew
    execute $q$update reports set color = 'white',  size = 'small'  where id = '20000000-0000-0000-0000-000000000004'$q$; -- Whiskers
    execute $q$update reports set color = 'cream',  size = 'large'  where id = '20000000-0000-0000-0000-000000000008'$q$; -- Biscuit
    execute $q$update reports set color = 'cream',  size = 'small'  where id = '20000000-0000-0000-0000-000000000011'$q$; -- Lazy
    execute $q$update reports set color = 'multicolor', size = 'small' where id = '20000000-0000-0000-0000-000000000016'$q$; -- Buddy
    execute $q$update reports set color = 'gray' where id = '20000000-0000-0000-0000-000000000007'$q$; -- gato atigrado (antes el color venía pegado a la raza: "Domestic shorthair, gray tabby")
  end if;
  if exists (select 1 from pg_proc where proname = 'recompute_matches_for_lost') then
    perform recompute_matches_for_lost(id) from reports where id::text like '20000000-0000-0000-0000-0000000000__' and status = 'lost';
  end if;

  -- 7. Reportes PROPIOS para probar My Reports (fase 4): tu avistamiento vigente del Husky (ahora con foto), un Lost
  --    anterior de Max ya reunido (Buddy, para no repetir a Max). El avistamiento "mío" SIN foto y ya vencido (antes
  --    'Domestic Shorthair' con este mismo ID) y el avistamiento resuelto se movieron a seed_edge_cases.sql.
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000012', me, 'sighted', 'dog', null, 'Siberian Husky',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/siberian-husky-sighting.jpg', 45, 32, 170,
      'Blue-gray eyes, wearing a collar with a tag, sniffing around the yard.', 'calm',
      st_setsrid(st_makepoint(-74.030, 40.7755), 4326)::geography, 'Bergenline Ave & 40th St, Union City, NJ 07087, United States', null, now() - interval '5 hours', null, null),
    ('20000000-0000-0000-0000-000000000016', me, 'reunited', 'dog', 'Buddy', 'Beagle', 'https://images.unsplash.com/photo-1703721025121-26d64508482b', 30, 45, null,
      'Found two blocks away, safe and sound.', null,
      st_setsrid(st_makepoint(-74.0335, 40.7803), 4326)::geography, 'Tonnelle Ave & 42nd St, North Bergen, NJ 07047, United States', '(201) 555-0100', now() - interval '6 days', now() - interval '3 days', buddy_pet);
  if exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'resolution') then
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
