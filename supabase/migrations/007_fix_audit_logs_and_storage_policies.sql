-- 007_fix_audit_logs_and_storage_policies.sql
-- 1) Crea public.audit_logs para evitar fallas en triggers de auditoría.
-- 2) Configura bucket/policies de Storage para documentos de inasistencias.

create table if not exists public.audit_logs (
  id bigserial primary key,
  table_name text not null,
  record_id uuid null,
  action text not null,
  old_data jsonb null,
  new_data jsonb null,
  changed_by uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

grant select, insert on public.audit_logs to authenticated;

drop policy if exists p_audit_logs_staff_insert on public.audit_logs;
create policy p_audit_logs_staff_insert
on public.audit_logs
for insert
to authenticated
with check (public.is_staff());

drop policy if exists p_audit_logs_superuser_select on public.audit_logs;
create policy p_audit_logs_superuser_select
on public.audit_logs
for select
to authenticated
using (public.is_superuser());

create index if not exists idx_audit_logs_table_record
  on public.audit_logs(table_name, record_id);

create index if not exists idx_audit_logs_created_at
  on public.audit_logs(created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists p_documents_public_read on storage.objects;
create policy p_documents_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'documents');

drop policy if exists p_documents_staff_insert on storage.objects;
create policy p_documents_staff_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and public.is_staff()
);

drop policy if exists p_documents_staff_update on storage.objects;
create policy p_documents_staff_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'documents'
  and public.is_staff()
)
with check (
  bucket_id = 'documents'
  and public.is_staff()
);

drop policy if exists p_documents_staff_delete on storage.objects;
create policy p_documents_staff_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'documents'
  and public.is_staff()
);
