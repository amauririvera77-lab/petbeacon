-- seed_edge_cases.sql — reportes propios adicionales para "My Reports" y para reforzar las coincidencias de Luna.
-- Se puede correr las veces que quieras.
--
-- CUÁNDO CORRERLO: DESPUÉS de seed_demo_reset.sql (usa el Lost de Luna, '...002', que ese script crea, y la misma
-- resolución de "tu cuenta" que usa ese script). Pégalo entero en el SQL Editor y ejecuta Run.
--
-- FOTOS: las 4 ya tienen foto real (PHOTO_CREDITS.md). '...013' y '...014' probaban antes la silueta por especie en
-- Past reports (sin foto) — esa regla sigue implementada en el código (SpeciesPlaceholder), solo que ya no tiene un
-- ejemplo dedicado en los datos de demo (ajuste de My Reports, 2026-09-30: el historial debía dejar de mostrar
-- avistamientos sin foto para poder verificar ahí también la etiqueta canónica de raza contra la foto real).
--
-- QUÉ HACE (por ID fijo, no toca nada más — mismo criterio de seguridad que seed_demo_reset.sql)
--   1. Borra solo sus propias filas: '20000000-0000-0000-0000-000000000013/014/017/018'.
--   2. Recrea 4 reportes:
--        '...013' Avistamiento mío, gato, ya vencido (60 h), CON foto → fila de "Past reports" (PastReports.tsx).
--        '...014' Avistamiento mío, resuelto (returned_to_owner), CON foto → solo si existe la columna `resolution` (0020).
--        '...017' Avistamiento mío, perro (Terrier mix), VIGENTE (<48 h), CON foto.
--        '...018' Avistamiento de otra persona (demo_reporter), gato, misma raza EXACTA que Luna (Siamese), cerca de
--                 ella, CON foto → coincidencia 'strong' con Luna (breed_compat exacto + foto + sin color/tamaño en contra).
--
-- NOTIFICACIONES: igual que seed_demo_reset.sql, desactiva los triggers de push mientras corre (deja el mismo rastro
-- que ese script: si aquí v_send_push queda en false, no se manda nada real).

do $$
declare
  demo_owner    constant uuid := '00000000-0000-0000-0000-000000000001';
  demo_reporter constant uuid := '00000000-0000-0000-0000-000000000002';
  v_send_push   boolean := false; -- true = deja activos los triggers que envían push reales (igual que seed_demo_reset.sql)
  me            uuid;
  luna_loc      geography;
begin
  me := coalesce((select id from profiles where id not in (demo_owner, demo_reporter) order by created_at desc limit 1), demo_owner);

  select location into luna_loc from reports where id = '20000000-0000-0000-0000-000000000002';
  if luna_loc is null then
    raise exception 'No encontré el Lost de Luna (...002) — corre seed_demo_reset.sql primero.';
  end if;

  if not v_send_push then
    if exists (select 1 from pg_trigger where tgname = 'reports_notify_nearby' and tgrelid = 'reports'::regclass) then
      alter table reports disable trigger reports_notify_nearby;
    end if;
    if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
      alter table matches disable trigger matches_notify;
    end if;
  end if;

  delete from reports where id in (
    '20000000-0000-0000-0000-000000000013',
    '20000000-0000-0000-0000-000000000014',
    '20000000-0000-0000-0000-000000000017',
    '20000000-0000-0000-0000-000000000018');

  -- '...013' — avistamiento mío, ya vencido, con foto (Simon Lohmann, PHOTO_CREDITS.md).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000013', me, 'sighted', 'cat', null, 'Domestic Shorthair',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/black-cat-sighting.jpg', 62, 42,
      'Black cat near the trash bins.', 'scared',
      st_setsrid(st_makepoint(-74.0285, 40.7810), 4326)::geography, 'Palisade Ave, Union City', null, now() - interval '60 hours', null, null);

  -- '...014' — avistamiento mío, resuelto, con foto (Nirzar Pangarkar, PHOTO_CREDITS.md) (solo si existe `resolution`, 0020).
  if exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'resolution') then
    execute $q$insert into reports (id, user_id, status, species, breed, photo_url, photo_focus_x, photo_focus_y,
                                    features_description, condition, location, location_label, created_at, resolution, resolved_at) values
      ('20000000-0000-0000-0000-000000000014', $1, 'resolved', 'cat', 'Siamese',
       'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/siamese-cat-resolved.jpg', 45, 38,
       'Was wearing a red collar.', 'calm',
       st_setsrid(st_makepoint(-74.0210, 40.7790), 4326)::geography, 'Bergenline Ave & 47th St, Union City', now() - interval '4 days', 'returned_to_owner', now() - interval '2 days')$q$ using me;
  end if;

  -- '...017' — avistamiento mío VIGENTE, con foto (Petra Andrews, PHOTO_CREDITS.md).
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at, pet_id) values
    ('20000000-0000-0000-0000-000000000017', me, 'sighted', 'dog', null, 'Terrier mix',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/terrier-mix-sighting.jpg', 50, 30, 140,
      'Tan and white, medium-sized. Friendly, sniffing around a fire hydrant.', 'calm',
      st_setsrid(st_makepoint(-74.026, 40.7845), 4326)::geography, 'JFK Blvd & 45th St, Union City', null, now() - interval '4 hours', null, null);

  -- '...018' — avistamiento de otra persona, misma raza EXACTA que Luna (Siamese) y cerca de ella, ahora con foto
  -- (Alex Meier, PHOTO_CREDITS.md) → coincidencia 'strong' con Luna.
  insert into reports (id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
                       features_description, condition, location, location_label, contact_phone_or_email, created_at, reunited_at) values
    ('20000000-0000-0000-0000-000000000018', demo_reporter, 'sighted', 'cat', null, 'Siamese cat',
      'https://ovrsyxyhtoaeymuowllv.supabase.co/storage/v1/object/public/report-photos/demo/siamese-cat-sighting.jpg', 37, 27, 190,
      'Cream-and-brown cat, very vocal, ran off before the reporter could get closer.', 'scared',
      st_project(luna_loc, 300, radians(140))::geography, 'Near Kennedy Blvd & 67th St, North Bergen', null, now() - interval '2 hours', null);

  -- Razas canónicas (0016), solo si esa migración ya se aplicó — mismo criterio que seed_demo_reset.sql, paso 6. Sin esto, estas 4 filas
  -- se quedaban con breed_id null para siempre (nunca pasan por el paso 6 del otro script, que ya corrió antes que éste) y el feed/detalle
  -- mostraban su texto libre tal cual ("Siamese cat") en vez de la etiqueta canónica ("Siamese") que sí usan las demás filas del seed.
  if exists (select 1 from information_schema.columns where table_name = 'reports' and column_name = 'breed_id') then
    execute $q$update reports set breed_id = map_breed_or_mixed(breed, species) where id in (
      '20000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000014',
      '20000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000018')$q$;
  end if;

  if exists (select 1 from pg_proc where proname = 'recompute_matches_for_lost') then
    perform recompute_matches_for_lost('20000000-0000-0000-0000-000000000002'); -- Luna
  end if;

  if not v_send_push then
    if exists (select 1 from pg_trigger where tgname = 'reports_notify_nearby' and tgrelid = 'reports'::regclass) then
      alter table reports enable trigger reports_notify_nearby;
    end if;
    if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
      alter table matches enable trigger matches_notify;
    end if;
  end if;

  raise notice 'Reportes adicionales regenerados: %, %, %, %',
    '...013 (mío, vencido, con foto)', '...014 (mío, resuelto, con foto)', '...017 (mío, vigente, con foto)', '...018 (otra persona, con foto, strong con Luna)';
end $$;
