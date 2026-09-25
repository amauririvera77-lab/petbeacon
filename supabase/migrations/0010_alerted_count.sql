-- 0010 · "Neighbors alerted" — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar.
--
-- La tarjeta de estado del reporte propio (fase 2.1) muestra "214 neighbors alerted". Hoy ese dato no existe: el trigger de push
-- (0005) envía las notificaciones pero no guarda a cuántas personas. Esta migración:
--   1. Agrega reports.alerted_count (nullable: los reportes anteriores quedan en null y la app oculta el dato en lugar de inventarlo).
--   2. Hace que notify_nearby_lost() guarde cuántos vecinos recibieron el aviso.
-- Definición honesta de "alertado": usuarios dentro de su propio radio de alerta que tienen notificaciones push activas y token.
-- Quien no tiene push no cuenta. Tope de 100 por envío (límite de la API de Expo): con más de 100 vecinos el número marca 100.

alter table reports add column if not exists alerted_count integer check (alerted_count >= 0);

-- Las columnas de `reports` se leen con permisos por columna (0003); la nueva no es sensible (un número).
grant select (alerted_count) on reports to anon, authenticated;

create or replace function notify_nearby_lost() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare msgs jsonb;
begin
  if new.status <> 'lost' then return new; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'to', t.push_token,
    'title', 'Lost ' || new.species || ' nearby',
    'body', coalesce(new.name, 'A pet') || ' was last seen' || coalesce(' near ' || new.location_label, '') || '.',
    'sound', 'default',
    'data', jsonb_build_object('type', 'lost', 'reportId', new.id)
  )), '[]'::jsonb) into msgs
  from (
    select p.push_token from profiles p
    where p.id <> new.user_id
      and p.push_token is not null
      and p.push_notifications_enabled
      and p.home is not null
      and st_dwithin(p.home, new.location, p.alert_radius_mi * 1609.344)
    limit 100
  ) t;
  perform send_push(msgs);
  update reports set alerted_count = jsonb_array_length(msgs) where id = new.id;
  return new;
exception when others then
  raise warning 'notify_nearby_lost failed: %', sqlerrm;
  return new;
end $$;
