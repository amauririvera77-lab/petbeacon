-- 0015 · Vínculo mascota ↔ reporte Lost — PENDIENTE DE APROBACIÓN. Requiere que la 0014 ya esté aplicada.
--
-- Qué hace (Fase 1 de Profile/Pets):
--  1. Todo reporte Lost (y Reunited) propio queda vinculado a una mascota registrada (`reports.pet_id`). Los existentes sin mascota se
--     vinculan a la que coincida por (usuario, nombre, especie) o crean una nueva con su foto, nombre, especie y raza.
--  2. Una mascota solo puede tener UN reporte Lost activo (índice único parcial). Si hoy hay duplicados se conserva el más reciente; los demás
--     pasan a 'closed' y sus coincidencias se REASIGNAN al que se conserva (recalculadas respecto a su ubicación).
--  3. Reglas en el servidor (no solo en la interfaz): un Lost exige pet_id; la mascota debe ser del mismo usuario; no se puede borrar una
--     mascota con un Lost activo.
--  4. Editar la mascota actualiza los campos públicos de su Lost activo (nombre, especie, raza, foto) y se recalculan sus coincidencias.
--
-- No cambia permisos. Mientras corre se pausa el envío de push de coincidencias para no avisar de coincidencias que ya existían.

-- ── A. Recalcular coincidencias de un Lost (misma lógica que 0009/0012) ────────────────────────────────────────────────
-- Actualiza las coincidencias existentes (distancia, fuerza, motivos) y añade las que ahora cumplen las reglas. Nunca reactiva una
-- coincidencia descartada ni borra nada: las que dejan de cumplir las reglas quedan ocultas (passes_rules = false).
create or replace function recompute_matches_for_lost(p_lost uuid) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare l reports;
begin
  select * into l from reports where id = p_lost and status = 'lost';
  if not found then return; end if;

  update matches m set
    distance_mi = round((st_distance(l.location, s.location) / 1609.344)::numeric, 2),
    confidence = case when breed_compat(l.breed, s.breed, l.species) = 'exact' and s.photo_url is not null
                      then 'strong'::match_confidence else 'possible'::match_confidence end,
    reasons = jsonb_build_object(
      'same_species', l.species = s.species,
      'breed', breed_compat(l.breed, s.breed, l.species),
      'has_photo', s.photo_url is not null,
      'distance_mi', round((st_distance(l.location, s.location) / 1609.344)::numeric, 2),
      'radius_mi', match_radius_mi(s.created_at - l.created_at),
      'seen_after_loss', s.created_at >= l.created_at,
      'minutes_after_loss', round((extract(epoch from (s.created_at - l.created_at)) / 60)::numeric),
      'passes_rules', (l.species = s.species
                       and s.created_at >= l.created_at
                       and st_distance(l.location, s.location) / 1609.344 <= match_radius_mi(s.created_at - l.created_at)
                       and breed_compat(l.breed, s.breed, l.species) <> 'incompatible'))
  from reports s
  where m.lost_report_id = l.id and m.sighted_report_id = s.id;

  insert into matches (lost_report_id, sighted_report_id, confidence, distance_mi, reasons)
  select l.id, s.id,
         case when c.k = 'exact' and s.photo_url is not null then 'strong'::match_confidence else 'possible'::match_confidence end,
         round(d.miles::numeric, 2),
         jsonb_build_object(
           'same_species', true, 'breed', c.k, 'has_photo', s.photo_url is not null,
           'distance_mi', round(d.miles::numeric, 2), 'radius_mi', match_radius_mi(s.created_at - l.created_at),
           'seen_after_loss', true,
           'minutes_after_loss', round((extract(epoch from (s.created_at - l.created_at)) / 60)::numeric),
           'passes_rules', true)
  from reports s
  cross join lateral (select st_distance(l.location, s.location) / 1609.344 as miles) d
  cross join lateral (select breed_compat(l.breed, s.breed, l.species) as k) c
  where s.status = 'sighted' and s.user_id <> l.user_id and s.species = l.species
    and s.created_at >= l.created_at
    and d.miles <= match_radius_mi(s.created_at - l.created_at)
    and c.k <> 'incompatible'
  on conflict do nothing;
end $$;

-- ── B. Migración de datos ─────────────────────────────────────────────────────────────────────────────────────────────
do $$
declare g record; r reports; pid uuid; keep record;
begin
  -- Sin avisos push mientras se reasignan y recalculan coincidencias que ya existían.
  if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
    alter table matches disable trigger matches_notify;
  end if;

  -- 1a. Vincular a una mascota ya registrada con el mismo nombre y especie del mismo usuario.
  update reports rp set pet_id = p.id
  from pets p
  where rp.pet_id is null and rp.status in ('lost', 'reunited') and rp.name is not null
    and p.user_id = rp.user_id and p.species = rp.species and lower(btrim(p.name)) = lower(btrim(rp.name));

  -- 1b. Crear una mascota por cada (usuario, nombre, especie) restante, con los datos de su reporte más reciente.
  for g in
    select distinct user_id, species, lower(btrim(coalesce(name, ''))) as k
    from reports where pet_id is null and status in ('lost', 'reunited')
  loop
    select * into r from reports
    where pet_id is null and status in ('lost', 'reunited') and user_id = g.user_id and species = g.species
      and lower(btrim(coalesce(name, ''))) = g.k
    order by created_at desc limit 1;

    insert into pets (user_id, name, species, breed, photo_url)
    values (g.user_id, coalesce(nullif(btrim(r.name), ''), 'Unnamed ' || g.species::text), g.species, r.breed, r.photo_url)
    returning id into pid;

    update reports set pet_id = pid
    where pet_id is null and status in ('lost', 'reunited') and user_id = g.user_id and species = g.species
      and lower(btrim(coalesce(name, ''))) = g.k;
  end loop;

  -- 2. Duplicados: por mascota se conserva el Lost activo más reciente; los demás pasan a 'closed' y sus coincidencias se reasignan.
  for keep in
    select pet_id, (array_agg(id order by created_at desc))[1] as keep_id, (array_agg(id order by created_at desc))[2:] as dup_ids
    from reports where status = 'lost' and pet_id is not null
    group by pet_id having count(*) > 1
  loop
    insert into matches (lost_report_id, sighted_report_id, confidence, dismissed, created_at, distance_mi, reasons)
    select keep.keep_id, m.sighted_report_id, m.confidence, m.dismissed, m.created_at, m.distance_mi, m.reasons
    from matches m where m.lost_report_id = any (keep.dup_ids)
    on conflict (lost_report_id, sighted_report_id) do nothing;
    delete from matches where lost_report_id = any (keep.dup_ids);
    update reports set status = 'closed' where id = any (keep.dup_ids);
    perform recompute_matches_for_lost(keep.keep_id);
  end loop;

  if exists (select 1 from pg_trigger where tgname = 'matches_notify' and tgrelid = 'matches'::regclass) then
    alter table matches enable trigger matches_notify;
  end if;
end $$;

-- ── C. Reglas en el servidor ──────────────────────────────────────────────────────────────────────────────────────────
-- Una mascota, un solo Lost activo. Un segundo INSERT/UPDATE falla con 23505 (unique_violation), también en llamadas directas a la API.
create unique index if not exists reports_one_active_lost_per_pet on reports (pet_id) where status = 'lost';

create or replace function reports_pet_rules() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'lost' and new.pet_id is null then
    raise exception 'A Lost report must be linked to one of your pets.' using errcode = '23514';
  end if;
  if new.pet_id is not null and not exists (select 1 from pets where id = new.pet_id and user_id = new.user_id) then
    raise exception 'That pet does not belong to this account.' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists reports_pet_rules on reports;
create trigger reports_pet_rules before insert or update of status, pet_id, user_id on reports
  for each row execute function reports_pet_rules();

-- No se puede borrar una mascota con un Lost activo (tampoco vía ON DELETE SET NULL).
create or replace function pets_block_delete_when_lost() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from reports where pet_id = old.id and status = 'lost') then
    raise exception 'This pet has an active Lost report. Close the report first.' using errcode = '23503';
  end if;
  return old;
end $$;
drop trigger if exists pets_block_delete_when_lost on pets;
create trigger pets_block_delete_when_lost before delete on pets
  for each row execute function pets_block_delete_when_lost();

-- ── D. Editar la mascota actualiza su Lost activo y se recalculan sus coincidencias ────────────────────────────────────
create or replace function sync_pet_to_active_report() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.name, new.species, new.breed, new.photo_url) is distinct from (old.name, old.species, old.breed, old.photo_url) then
    update reports set
      name = new.name, species = new.species, breed = new.breed, photo_url = new.photo_url,
      -- una foto nueva invalida el punto focal y el zoom de la anterior
      photo_focus_x = case when photo_url is distinct from new.photo_url then null else photo_focus_x end,
      photo_focus_y = case when photo_url is distinct from new.photo_url then null else photo_focus_y end,
      photo_zoom    = case when photo_url is distinct from new.photo_url then null else photo_zoom end
    where pet_id = new.id and status = 'lost';
  end if;
  return new;
end $$;
drop trigger if exists pets_sync_active_report on pets;
create trigger pets_sync_active_report after update on pets for each row execute function sync_pet_to_active_report();

create or replace function reports_recompute_matches() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform recompute_matches_for_lost(new.id);
  return new;
end $$;
drop trigger if exists reports_recompute_matches on reports;
create trigger reports_recompute_matches after update of species, breed, photo_url on reports
  for each row when (new.status = 'lost') execute function reports_recompute_matches();

-- Criterios de aceptación (ambos deben devolver 0):
--   select count(*) from reports where status in ('lost', 'reunited') and pet_id is null;
--   select count(*) from (select pet_id from reports where status = 'lost' group by pet_id having count(*) > 1) d;
