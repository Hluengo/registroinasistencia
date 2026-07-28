-- Restores private Storage access used by Registro de Inasistencias.
-- The shared Supabase hardening migration removed the documents policies.

update storage.buckets
set public = false
where id = 'documents';

drop policy if exists p_documents_staff_select on storage.objects;
create policy p_documents_staff_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'absences'
  and public.is_staff()
);

drop policy if exists p_documents_staff_insert on storage.objects;
create policy p_documents_staff_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'absences'
  and public.is_staff()
);

drop policy if exists p_documents_staff_update on storage.objects;
create policy p_documents_staff_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'absences'
  and public.is_staff()
)
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'absences'
  and public.is_staff()
);

drop policy if exists p_documents_staff_delete on storage.objects;
create policy p_documents_staff_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = 'absences'
  and public.is_staff()
);
