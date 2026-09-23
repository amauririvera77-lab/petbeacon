-- 1) Privacidad del contacto: hoy cualquiera con la anon key podría leer contact_phone_or_email de un Lost.
--    Se revoca la lectura de esa columna y se expone solo al dueño mediante una función.
revoke select on reports from anon, authenticated;
grant select (
  id, user_id, status, species, name, breed, photo_url, features_description,
  location, location_label, pet_id, matched_report_id, created_at, reunited_at
) on reports to anon, authenticated;

-- La vista active_reports hacía `select *` (incluía el contacto): se recrea sin esa columna.
drop view if exists active_reports;
create view active_reports as
select id, user_id, status, species, name, breed, photo_url, features_description,
       location, location_label, pet_id, matched_report_id, created_at, reunited_at
from reports
where status = 'lost'
   or (status = 'sighted' and created_at > now() - interval '48 hours')
   or (status = 'reunited' and reunited_at > now() - interval '24 hours');
grant select on active_reports to anon, authenticated;

-- Solo el dueño del reporte puede leer su contacto (para editar el reporte o generar su flyer).
create or replace function my_report_contact(report_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select contact_phone_or_email from reports where id = report_id and user_id = auth.uid();
$$;
revoke all on function my_report_contact(uuid) from public, anon;
grant execute on function my_report_contact(uuid) to authenticated;

-- 2) Storage: bucket público `report-photos` (créalo en el dashboard); solo usuarios autenticados suben,
--    y solo dentro de su propia carpeta (<uid>/archivo).
drop policy if exists "auth upload report photos" on storage.objects;
create policy "auth upload report photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'report-photos' and (storage.foldername(name))[1] = auth.uid()::text);
