-- Matching (CLAUDE.md §6) — correcciones y lectura para el dueño.

-- 1) Un usuario no debe hacer match consigo mismo (avistar a su propia mascota perdida no es una coincidencia útil).
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
    and l.user_id <> new.user_id
    and l.species = new.species
    and st_dwithin(l.location, new.location, p.alert_radius_mi * 1609.344)
  on conflict do nothing;
  return new;
end $$;

-- 2) Matches del usuario con los datos del avistamiento (foto, lugar, raza). Solo Lost activos y avistamientos vigentes (48h).
--    Corre como invocador: RLS de `matches` ya limita las filas al dueño del Lost.
create or replace function my_matches()
returns table (
  id uuid, lost_report_id uuid, lost_name text, sighted_report_id uuid, confidence match_confidence,
  dismissed boolean, created_at timestamptz, sighted_photo_url text, sighted_label text, sighted_breed text
)
language sql stable as $$
  select m.id, m.lost_report_id, l.name, m.sighted_report_id, m.confidence, m.dismissed, m.created_at,
         s.photo_url, s.location_label, s.breed
  from matches m
  join reports l on l.id = m.lost_report_id
  join reports s on s.id = m.sighted_report_id
  where l.user_id = auth.uid()
    and l.status = 'lost'
    and s.status = 'sighted'
    and s.created_at > now() - interval '48 hours'
  order by m.created_at desc;
$$;
grant execute on function my_matches() to authenticated;
