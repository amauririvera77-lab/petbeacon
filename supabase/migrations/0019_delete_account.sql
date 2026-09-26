-- 0019 · Eliminar cuenta — PENDIENTE DE APROBACIÓN (flujo aprobado por el usuario), NO APLICAR sin revisar. Requiere 0015 y 0018.
--
-- Flujo (Profile → Delete account):
--   1. La app pide una confirmación explícita (escribir DELETE) y explica qué se elimina.
--   2. La APP borra las fotos del usuario del bucket `report-photos` (carpeta <uid>/…) con la API de Storage. Desde SQL no es posible:
--      Supabase bloquea el DELETE directo en storage.objects (borraría la fila pero dejaría el archivo real). Por eso esta migración añade
--      dos políticas para que cada usuario pueda LISTAR y BORRAR únicamente su propia carpeta.
--   3. La app llama a delete_my_account(), que en una sola transacción borra, en el orden que exigen las reglas de la 0015: sus coincidencias,
--      reportes (los Lost activos dejan de existir, así que no envían más alertas), mascotas, perfil y, por último, el usuario de auth.users.
--   4. La app cierra la sesión local y vuelve al onboarding.
-- La función solo actúa sobre auth.uid() (nunca recibe un id), tiene search_path fijo y no es ejecutable por anon.

drop policy if exists "auth list own report photos" on storage.objects;
create policy "auth list own report photos" on storage.objects for select to authenticated
  using (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "auth delete own report photos" on storage.objects;
create policy "auth delete own report photos" on storage.objects for delete to authenticated
  using (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'You are not signed in.' using errcode = '28000'; end if;

  -- Coincidencias donde participan sus reportes (como Lost o como avistamiento).
  delete from matches where lost_report_id in (select id from reports where user_id = v_uid)
                         or sighted_report_id in (select id from reports where user_id = v_uid);
  -- Reportes: con ellos desaparecen sus Lost activos (dejan de generar alertas y coincidencias).
  delete from reports where user_id = v_uid;
  -- Mascotas (ya no hay Lost activos, así que la regla que lo impide no se activa), perfil y usuario.
  delete from pets where user_id = v_uid;
  delete from profiles where id = v_uid;
  delete from auth.users where id = v_uid;
end $$;
revoke all on function delete_my_account() from public, anon;
grant execute on function delete_my_account() to authenticated;

-- Comprobación de las políticas de Storage (deben aparecer las dos):
--   select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like '%own report photos';
