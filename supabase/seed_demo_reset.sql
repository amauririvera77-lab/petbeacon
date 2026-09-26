-- seed_demo_reset.sql — regenera los datos de DEMO con fechas relativas a now(). Se puede correr las veces que quieras.
--
-- CUÁNDO CORRERLO: DESPUÉS de aplicar 0009, 0010 y 0011 (las reglas de matching y las columnas nuevas ya deben existir) y con tu
-- cuenta ya creada en la app (para que el reporte de Max sea "mío"). Pégalo entero en el SQL Editor y ejecuta Run.
--
-- QUÉ HACE
--   1. Borra SOLO las filas de demo, por ID fijo: los reportes '20000000-0000-0000-0000-0000000000NN' y los del seed antiguo
--      '10000000-0000-0000-0000-00000000000N' (sus coincidencias caen en cascada). No toca nada más: ni tus reportes reales,
--      ni perfiles, ni mascotas, ni recursos.
--   2. Recrea 9 reportes con fechas relativas a now(), ubicados a distancias reales de un centro (ver AJUSTES):
--        Lost      Max (Golden, TUYO, 3 h, 0.4 mi) · Luna (gata Siamese, 30 h, 2.0 mi) · "Bartholomew Maximilian von Schnauzenberg"
--                  (nombre largo, 48 h, 3.2 mi, sin foto) · Whiskers (gato Persian, 80 h, 4.5 mi, sin foto)
--        Sighted   Golden Retriever SIN FOTO (30 min, a 0.2 mi de Max → coincidencia STRONG para Max) · Beagle mix (1 h, 0.9 mi →
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
  v_center_lat  double precision := null;   --   p. ej. North Bergen: lng -74.0068, lat 40.8015
  v_send_push   boolean          := false;  -- true = deja activos los triggers que envían push reales
  -- ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  demo_owner    constant uuid := '00000000-0000-0000-0000-000000000001';
  demo_reporter constant uuid := '00000000-0000-0000-0000-000000000002';
  me            uuid;
  center        geography;
  max_loc       geography;
  has_alerted   boolean;
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

  -- 2a. Reportes Lost y Reunited (primero: los avistamientos necesitan que el Lost ya exista para generar coincidencias).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, location, location_label, contact_phone_or_email, created_at, reunited_at) values
    ('20000000-0000-0000-0000-000000000001', me, 'lost', 'dog', 'Max', 'Golden Retriever',
      'https://images.unsplash.com/photo-1552053831-71594a27632d', 52, 37, 190,
      'Blue collar with a silver tag, limps slightly on his left leg.',
      st_project(center, 640, radians(40))::geography, 'near Maple Park', '(914) 555-0100', now() - interval '3 hours', null),
    ('20000000-0000-0000-0000-000000000002', demo_owner, 'lost', 'cat', 'Luna', 'Siamese cat',
      'https://images.unsplash.com/photo-1695708794933-57424f0bf14e', 50, 30, 190,
      'Very shy — may not approach strangers, please don''t chase.',
      st_project(center, 3200, radians(200))::geography, 'Birchwood Ln', 'luna.owner@example.com', now() - interval '30 hours', null),
    ('20000000-0000-0000-0000-000000000003', demo_owner, 'lost', 'dog', 'Bartholomew Maximilian von Schnauzenberg', 'Miniature Schnauzer',
      null, null, null, null,
      'Grey and white beard, answers to Barty. Wearing a red harness.',
      st_project(center, 5150, radians(300))::geography, 'Lakeview Ave', '(914) 555-0142', now() - interval '48 hours', null),
    ('20000000-0000-0000-0000-000000000004', demo_owner, 'lost', 'cat', 'Whiskers', 'Persian',
      null, null, null, null,
      'Flat-faced, long white fur. Indoor cat that slipped out through the back door.',
      st_project(center, 7250, radians(120))::geography, 'Grand St', 'whiskers.family@example.com', now() - interval '80 hours', null),
    ('20000000-0000-0000-0000-000000000008', demo_owner, 'reunited', 'dog', 'Biscuit', 'Labrador mix',
      'https://images.unsplash.com/photo-1585588640338-2c3dc723e638', 56, 25, 190,
      'Reunited with owner within 3 hours of the alert going live.',
      st_project(center, 2570, radians(20))::geography, 'near Maple Park', '(914) 555-0100', now() - interval '18 hours', now() - interval '5 hours');

  select location into max_loc from reports where id = '20000000-0000-0000-0000-000000000001';

  -- 2b. Avistamientos (el trigger de matching los cruza con los Lost de arriba).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, location, location_label, contact_phone_or_email, created_at, reunited_at) values
    ('20000000-0000-0000-0000-000000000005', demo_reporter, 'sighted', 'dog', null, 'Golden Retriever',
      null, null, null, null,                                                        -- SIN FOTO a propósito (muestra la silueta)
      'Golden coat, blue collar. Stayed near the park entrance and let people approach.',
      st_project(max_loc, 320, radians(60))::geography, 'Maple Park entrance', null, now() - interval '30 minutes', null),
    ('20000000-0000-0000-0000-000000000006', demo_reporter, 'sighted', 'dog', null, 'Beagle mix',
      'https://images.unsplash.com/photo-1703721025121-26d64508482b', 28, 46, 150,
      'No collar visible. Friendly, approached the reporter calmly.',
      st_project(center, 1450, radians(100))::geography, '5th Ave & Elm St', null, now() - interval '1 hour', null),
    ('20000000-0000-0000-0000-000000000007', demo_reporter, 'sighted', 'cat', null, 'Domestic shorthair, gray tabby',
      'https://images.unsplash.com/photo-1557735802-ef14538b00a4', 43, 35, 240,
      'Skittish — seen hiding under a porch, did not approach.',
      st_project(center, 1770, radians(250))::geography, 'Oak Street', null, now() - interval '6 hours', null),
    ('20000000-0000-0000-0000-000000000009', demo_reporter, 'sighted', 'dog', null, 'Labrador mix',
      null, null, null, null,
      'Black lab mix, no collar, drinking from a puddle.',
      st_project(center, 4300, radians(330))::geography, 'Riverside Dr', null, now() - interval '40 hours', null);

  -- 3. Evento con fecha concreta (0011) y conteo de demostración (0010), solo si esas columnas existen.
  select exists (select 1 from information_schema.columns where table_name = 'resources' and column_name = 'event_date') into has_event;
  if has_event then
    execute $q$update resources set event_date = current_date + ((6 - extract(dow from current_date)::int + 7) % 7)
               where name = 'Free pet food pantry'$q$;
  end if;
  select exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'alerted_count') into has_alerted;
  if has_alerted then
    execute $q$update reports set alerted_count = 14 where id = '20000000-0000-0000-0000-000000000001'$q$;
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
