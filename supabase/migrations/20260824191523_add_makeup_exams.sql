-- Recuperaciones individuales derivadas de pruebas de curso o inasistencias.
-- La tabla pertenece al tenant y a la aplicacion Registro de Inasistencias.

create table if not exists public.makeup_exams (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.current_tenant_id()
    references public.tenants(id),
  student_id uuid not null references public.students(id) on delete cascade,
  test_id uuid null references public.tests(id) on delete set null,
  source_absence_id uuid null references public.absences(id) on delete set null,
  original_date date null,
  scheduled_date date not null,
  subject text not null check (btrim(subject) <> ''),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'rendida', 'justificada', 'ausente', 'reprogramada')),
  scheduled_time text null,
  room text null,
  proctor text null,
  grade numeric(3,1) null check (grade is null or grade between 1.0 and 7.0),
  notes text null,
  created_by uuid null references auth.users(id) on delete set null,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_makeup_exams_tenant_date
  on public.makeup_exams(tenant_id, scheduled_date);

create index if not exists idx_makeup_exams_tenant_student
  on public.makeup_exams(tenant_id, student_id);

create index if not exists idx_makeup_exams_tenant_status
  on public.makeup_exams(tenant_id, status);

create index if not exists idx_makeup_exams_tenant_test
  on public.makeup_exams(tenant_id, test_id)
  where test_id is not null;

create or replace function public.touch_makeup_exams_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists trg_touch_makeup_exams_updated_at on public.makeup_exams;
create trigger trg_touch_makeup_exams_updated_at
before update on public.makeup_exams
for each row
execute function public.touch_makeup_exams_updated_at();

drop trigger if exists tr_audit_makeup_exams on public.makeup_exams;
create trigger tr_audit_makeup_exams
after insert or update or delete on public.makeup_exams
for each row
execute function public.process_audit_log();

alter table public.makeup_exams enable row level security;

revoke all on public.makeup_exams from anon;
grant select, insert, update, delete on public.makeup_exams to authenticated;

drop policy if exists makeup_exams_staff_select on public.makeup_exams;
create policy makeup_exams_staff_select
on public.makeup_exams
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.is_superuser()
    or public.has_app_access(
      'inasistencias',
      array['staff', 'superuser', 'admin', 'direccion']::text[]
    )
  )
);

drop policy if exists makeup_exams_staff_insert on public.makeup_exams;
create policy makeup_exams_staff_insert
on public.makeup_exams
for insert
to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.is_superuser()
    or public.has_app_access(
      'inasistencias',
      array['staff', 'superuser', 'admin', 'direccion']::text[]
    )
  )
  and exists (
    select 1
    from public.students s
    where s.id = student_id
      and s.tenant_id = public.current_tenant_id()
  )
  and (
    test_id is null
    or exists (
      select 1
      from public.tests t
      join public.courses c on c.id = t.course_id
      where t.id = test_id
        and c.tenant_id = public.current_tenant_id()
    )
  )
  and (
    source_absence_id is null
    or exists (
      select 1
      from public.absences a
      join public.students s on s.id = a.student_id
      where a.id = source_absence_id
        and s.tenant_id = public.current_tenant_id()
    )
  )
);

drop policy if exists makeup_exams_staff_update on public.makeup_exams;
create policy makeup_exams_staff_update
on public.makeup_exams
for update
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.is_superuser()
    or public.has_app_access(
      'inasistencias',
      array['staff', 'superuser', 'admin', 'direccion']::text[]
    )
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.is_superuser()
    or public.has_app_access(
      'inasistencias',
      array['staff', 'superuser', 'admin', 'direccion']::text[]
    )
  )
  and exists (
    select 1
    from public.students s
    where s.id = student_id
      and s.tenant_id = public.current_tenant_id()
  )
);

drop policy if exists makeup_exams_superuser_delete on public.makeup_exams;
create policy makeup_exams_superuser_delete
on public.makeup_exams
for delete
to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.is_superuser()
);

comment on table public.makeup_exams is
  'Pruebas atrasadas o recuperaciones individuales de Registro de Inasistencias.';
