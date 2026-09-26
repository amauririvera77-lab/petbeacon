-- 0012 · Coincidencias sin foto y columna `condition` — PENDIENTE DE APROBACIÓN, NO APLICAR sin revisar.
--
-- 1. Regla de coincidencias (evaluación UX, punto A.1): un avistamiento SIN FOTO nunca puede dar una coincidencia 'strong'.
--    Sin foto el dueño no puede confirmarla visualmente, así que el máximo es 'possible'. 'strong' exige, ahora, raza idéntica
--    Y foto. Se aplica al trigger (coincidencias nuevas) y a las coincidencias que ya existen.
-- 2. reports.condition (D.2): la condición del animal en un avistamiento ("calm", "scared", "injured", "unsure") deja de guardarse
--    como texto pegado al inicio de `features_description` ("Condition: Scared. …") y pasa a su propia columna. Los datos existentes
--    se migran (se extrae la condición y se quita ese prefijo de features_description).
--
-- Efectos sobre otras cosas:
--   · active_reports y reports_nearby() devuelven además `condition` (se recrean con las mismas columnas de antes + esa).
--   · No cambia el contacto ni ningún permiso existente; la columna nueva es legible por anon/authenticated como el resto.
--   · Es re-ejecutable: si ya se aplicó, no rompe ni duplica nada.

-- ── 1. Columna condition + migración de datos ───────────────────────────────────────────────────────────────────────
alter table reports add column if not exists condition text check (condition in ('calm', 'scared', 'injured', 'unsure'));
grant select (condition) on reports to anon, authenticated;

-- Extrae "Condition: Calm|Scared|Injured|Not sure." del INICIO de features_description (así lo escribía la app) y lo mueve a `condition`.
update reports set
  condition = case lower((regexp_match(features_description, '^\s*Condition:\s*(Calm|Scared|Injured|Not sure)\.?', 'i'))[1])
                when 'calm' then 'calm' when 'scared' then 'scared' when 'injured' then 'injured' else 'unsure' end,
  features_description = nullif(trim(regexp_replace(features_description, '^\s*Condition:\s*(Calm|Scared|Injured|Not sure)\.?\s*', '', 'i')), '')
where features_description ~* '^\s*Condition:\s*(Calm|Scared|Injured|Not sure)\.?';

-- Las vistas/funciones que devuelven columnas de reports se recrean con `condition` (misma forma que 0007 + esa columna).
drop view if exists active_reports;
create view active_reports as
select id, user_id, status, species, name, breed, photo_url, photo_focus_x, photo_focus_y, photo_zoom,
       features_description, condition, location, location_label, pet_id, matched_report_id, created_at, reunited_at
from reports
where status = 'lost'
   or (status = 'sighted' and created_at > now() - interval '48 hours')
   or (status = 'reunited' and reunited_at > now() - interval '24 hours');
grant select on active_reports to anon, authenticated;

drop function if exists reports_nearby(double precision, double precision, double precision);
create function reports_nearby(lat double precision, lng double precision, radius_mi double precision)
returns table (
  id uuid, status report_status, species species_type, name text, breed text, photo_url text,
  photo_focus_x smallint, photo_focus_y smallint, photo_zoom smallint,
  features_description text, condition text, location_label text, created_at timestamptz,
  lat double precision, lng double precision, distance_mi double precision
)
language sql stable as $$
  select r.id, r.status, r.species, r.name, r.breed, r.photo_url, r.photo_focus_x, r.photo_focus_y, r.photo_zoom,
         r.features_description, r.condition, r.location_label, r.created_at,
         st_y(r.location::geometry), st_x(r.location::geometry),
         st_distance(r.location, st_makepoint(lng, lat)::geography) / 1609.344
  from active_reports r
  where st_dwithin(r.location, st_makepoint(lng, lat)::geography, radius_mi * 1609.344)
  order by
    (r.status = 'lost' and r.created_at > now() - interval '72 hours') desc,
    r.created_at desc;
$$;
grant execute on function reports_nearby(double precision, double precision, double precision) to anon, authenticated;

-- ── 2. 'strong' exige raza idéntica Y foto en el avistamiento ─────────────────────────────────────────────────────────
create or replace function match_new_sighting() returns trigger language plpgsql security definer as $$
begin
  if new.status <> 'sighted' then return new; end if;
  insert into matches (lost_report_id, sighted_report_id, confidence, distance_mi, reasons)
  select l.id, new.id,
         case when c.k = 'exact' and new.photo_url is not null then 'strong'::match_confidence else 'possible'::match_confidence end,
         round(d.miles::numeric, 2),
         jsonb_build_object(
           'same_species', true,
           'breed', c.k,                                   -- exact | similar | different | unknown
           'has_photo', new.photo_url is not null,
           'distance_mi', round(d.miles::numeric, 2),
           'radius_mi', match_radius_mi(new.created_at - l.created_at),
           'seen_after_loss', true,
           'minutes_after_loss', round((extract(epoch from (new.created_at - l.created_at)) / 60)::numeric),
           'passes_rules', true
         )
  from reports l
  cross join lateral (select st_distance(l.location, new.location) / 1609.344 as miles) d
  cross join lateral (select breed_compat(l.breed, new.breed, l.species) as k) c
  where l.status = 'lost'
    and l.user_id <> new.user_id
    and l.species = new.species
    and new.created_at >= l.created_at
    and d.miles <= match_radius_mi(new.created_at - l.created_at)
    and c.k <> 'incompatible'
  on conflict do nothing;
  return new;
end $$;

-- Coincidencias que ya existen: toda 'strong' cuyo avistamiento no tenga foto baja a 'possible' (las descartadas también: es solo
-- una etiqueta de fuerza; no se borra ni se reactiva nada). Se anota el motivo en `reasons`.
update matches m set
  confidence = 'possible',
  reasons = coalesce(m.reasons, '{}'::jsonb) || jsonb_build_object('has_photo', false)
from reports s
where m.sighted_report_id = s.id and m.confidence = 'strong' and s.photo_url is null;

-- Criterio de aceptación (debe devolver 0): ninguna 'strong' con avistamiento sin foto.
--   select count(*) from matches m join reports s on s.id = m.sighted_report_id where m.confidence = 'strong' and s.photo_url is null;
