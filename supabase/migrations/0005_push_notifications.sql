-- Notificaciones push (Expo Push API) enviadas desde la base con pg_net. No requiere Edge Functions.
-- Dos eventos: (1) match nuevo → al dueño del Lost; (2) Lost nuevo → a usuarios cercanos ("Nearby users have been notified").
-- IMPORTANTE: nada de esto debe poder romper la publicación de un reporte: todo envío va en un bloque con excepción.

create extension if not exists pg_net with schema extensions;

create or replace function send_push(msgs jsonb) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if msgs is null or jsonb_typeof(msgs) <> 'array' or jsonb_array_length(msgs) = 0 then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := msgs,
    headers := '{"Content-Type":"application/json","Accept":"application/json"}'::jsonb
  );
exception when others then
  raise warning 'send_push failed: %', sqlerrm;
end $$;
revoke all on function send_push(jsonb) from public, anon, authenticated;

-- (1) Match → dueño del Lost
create or replace function notify_match() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare l reports; s reports; p profiles;
begin
  select * into l from reports where id = new.lost_report_id;
  select * into s from reports where id = new.sighted_report_id;
  select * into p from profiles where id = l.user_id;
  if p.push_token is not null and p.push_notifications_enabled then
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

drop trigger if exists matches_notify on matches;
create trigger matches_notify after insert on matches for each row execute function notify_match();

-- (2) Lost nuevo → usuarios cuyo radio de alerta (desde su ubicación base) cubre el punto. Máx. 100 por envío (límite de Expo).
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
  return new;
exception when others then
  raise warning 'notify_nearby_lost failed: %', sqlerrm;
  return new;
end $$;

drop trigger if exists reports_notify_nearby on reports;
create trigger reports_notify_nearby after insert on reports for each row execute function notify_nearby_lost();
