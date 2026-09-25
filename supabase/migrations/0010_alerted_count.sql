-- 0010 · "Neighbors alerted" y envío en lotes — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar.
--
-- 1. reports.alerted_count: cuántos vecinos recibieron el aviso de un Lost (lo muestra la tarjeta de estado, fase 2.1).
--    Nullable: los reportes anteriores quedan en null y la app oculta el dato en lugar de inventarlo.
-- 2. notify_nearby_lost() ya NO recorta a 100 vecinos. El 100 no era un tope de negocio: es el límite de la API de Expo Push
--    ("hasta 100 mensajes por solicitud"). Ahora se envía en LOTES de 100 hasta cubrir a todos los vecinos dentro del radio, y
--    alerted_count guarda el total real.
--
-- Definición honesta de "alertado": usuarios dentro de su propio radio de alerta que tienen push activo y token. Quien no tiene
-- push no cuenta.
--
-- Límite que sigue existiendo: Expo aplica 600 notificaciones por segundo por proyecto. Con cientos de vecinos a la vez los lotes
-- salen casi simultáneos; pg_net los procesa de forma asíncrona, pero un aviso masivo de miles de personas debería pasar a una cola
-- o a una Edge Function con reintentos. No hace falta hoy.

alter table reports add column if not exists alerted_count integer check (alerted_count >= 0);

-- Las columnas de `reports` se leen con permisos por columna (0003); la nueva no es sensible (un número).
grant select (alerted_count) on reports to anon, authenticated;

create or replace function notify_nearby_lost() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  total integer := 0;
  r record;
begin
  if new.status <> 'lost' then return new; end if;

  -- Un lote por cada 100 destinatarios (grp = 0, 1, 2…), cada uno con su propia llamada a la API de Expo.
  for r in
    select jsonb_agg(t.msg) as batch, count(*)::integer as n
    from (
      select jsonb_build_object(
               'to', p.push_token,
               'title', 'Lost ' || new.species || ' nearby',
               'body', coalesce(new.name, 'A pet') || ' was last seen' || coalesce(' near ' || new.location_label, '') || '.',
               'sound', 'default',
               'data', jsonb_build_object('type', 'lost', 'reportId', new.id)
             ) as msg,
             (row_number() over (order by p.id) - 1) / 100 as grp
      from profiles p
      where p.id <> new.user_id
        and p.push_token is not null
        and p.push_notifications_enabled
        and p.home is not null
        and st_dwithin(p.home, new.location, p.alert_radius_mi * 1609.344)
    ) t
    group by t.grp
    order by t.grp
  loop
    perform send_push(r.batch);   -- send_push() ya captura sus propios errores: un lote fallido no frena los demás
    total := total + r.n;
  end loop;

  update reports set alerted_count = total where id = new.id;
  return new;
exception when others then
  raise warning 'notify_nearby_lost failed: %', sqlerrm;
  return new;
end $$;
