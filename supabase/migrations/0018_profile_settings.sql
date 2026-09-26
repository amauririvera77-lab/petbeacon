-- 0018 · Ajustes de Profile — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar.
--
-- Qué hace (Profile, fase 3):
--  1. Notificaciones separadas (3.1): profiles.nearby_alerts_enabled ("Lost and sighted pets near you") y profiles.match_updates_enabled
--     ("When someone may have seen your pet"). Se inicializan con el valor actual de push_notifications_enabled, que queda como interruptor
--     heredado (la app lo mantiene = alguna de las dos activa). Los triggers de push respetan cada preferencia:
--        · notify_nearby_lost()  → nearby_alerts_enabled
--        · notify_match()        → match_updates_enabled
--  2. Datos del perfil (3.2): avatar_url, contact_email, contact_phone. Son PRIVADOS: `profiles` ya es solo del dueño (RLS "own profile").
--     Son datos de contacto del perfil; el correo de INICIO DE SESIÓN vive en auth.users y se gestiona con "Save your account".
--  3. Privacidad: flyer_show_contact (por defecto true): si es false, el flyer del dueño sale SIN su teléfono/correo.
--  4. Escala de radios coherente (3.4): opciones 1 / 3 / 5 / 10 mi. Cada alert_radius_mi existente pasa al valor más cercano; en un empate
--     (2 → 3, 4 → 5) se elige el mayor para no reducir la cobertura. Así el 6 actual pasa a 5. El CHECK (1–10) se mantiene.
-- Es re-ejecutable.

alter table profiles add column if not exists nearby_alerts_enabled boolean;
alter table profiles add column if not exists match_updates_enabled boolean;
update profiles set nearby_alerts_enabled = push_notifications_enabled where nearby_alerts_enabled is null;
update profiles set match_updates_enabled = push_notifications_enabled where match_updates_enabled is null;
alter table profiles alter column nearby_alerts_enabled set default true;
alter table profiles alter column match_updates_enabled set default true;
alter table profiles alter column nearby_alerts_enabled set not null;
alter table profiles alter column match_updates_enabled set not null;

alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists contact_email text;
alter table profiles add column if not exists contact_phone text;
alter table profiles add column if not exists flyer_show_contact boolean not null default true;

-- Escala 1 / 3 / 5 / 10 mi (mismo criterio que snapRadius() en la app).
update profiles set alert_radius_mi = case
  when alert_radius_mi <= 1 then 1
  when alert_radius_mi <= 2 then 3   -- 2 está a igual distancia de 1 y de 3: gana el mayor
  when alert_radius_mi <= 4 then case when alert_radius_mi = 3 then 3 else 5 end   -- 4 empata entre 3 y 5: gana 5
  when alert_radius_mi <= 7 then 5   -- 5, 6 y 7 (7 está más cerca de 5 que de 10)
  else 10                            -- 8, 9 y 10
end
where alert_radius_mi not in (1, 3, 5, 10);

-- ── Los avisos push respetan cada preferencia ────────────────────────────────────────────────────────────────────────
create or replace function notify_match() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare l reports; s reports; p profiles;
begin
  select * into l from reports where id = new.lost_report_id;
  select * into s from reports where id = new.sighted_report_id;
  select * into p from profiles where id = l.user_id;
  if p.push_token is not null and p.match_updates_enabled then
    perform send_push(jsonb_build_array(jsonb_build_object(
      'to', p.push_token,
      'title', case when new.confidence = 'strong' then 'Strong match' else 'Possible match' end || ' for ' || coalesce(l.name, 'your pet'),
      'body', 'A sighting' || coalesce(' near ' || s.location_label, '') || ' looks like your pet. Tap to view it.',
      'sound', 'default',
      'data', jsonb_build_object('type', 'match', 'matchId', new.id)
    )));
  end if;
  return new;
exception when others then
  raise warning 'notify_match failed: %', sqlerrm;
  return new;
end $$;

create or replace function notify_nearby_lost() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  total integer := 0;
  r record;
begin
  if new.status <> 'lost' then return new; end if;

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
        and p.nearby_alerts_enabled
        and p.home is not null
        and st_dwithin(p.home, new.location, p.alert_radius_mi * 1609.344)
    ) t
    group by t.grp
    order by t.grp
  loop
    perform send_push(r.batch);
    total := total + r.n;
  end loop;

  update reports set alerted_count = total where id = new.id;
  return new;
exception when others then
  raise warning 'notify_nearby_lost failed: %', sqlerrm;
  return new;
end $$;

-- Comprobación: el 6 pasó a 5 y no queda ningún valor fuera de la escala (debe devolver 0).
--   select count(*) from profiles where alert_radius_mi not in (1, 3, 5, 10);
