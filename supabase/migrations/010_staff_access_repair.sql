-- 010_staff_access_repair.sql
-- Reparación idempotente de acceso staff/superuser para vistas internas.
-- Escenario objetivo: vista pública funciona, pero dashboard/staff falla por permisos/policies incompletos.

-- Asegurar funciones de rol consistentes y ejecutables.
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role from public.profiles p where p.user_id = auth.uid()),
    'teacher'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_role() in ('staff', 'superuser');
$$;

create or replace function public.is_superuser()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_role() = 'superuser';
$$;

grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_superuser() to anon, authenticated;

-- Grants base (sin estos grants, RLS por sí solo no basta).
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.absences to authenticated;
grant select, insert, update, delete on public.tests to authenticated;
grant select, insert, update, delete on public.inspectorate_records to authenticated;
grant select, insert, update, delete on public.feriados_chile to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.instant_messages to authenticated;

-- Asegurar RLS habilitado.
alter table public.courses enable row level security;
alter table public.students enable row level security;
alter table public.absences enable row level security;
alter table public.tests enable row level security;
alter table public.inspectorate_records enable row level security;
alter table public.feriados_chile enable row level security;
alter table public.profiles enable row level security;
alter table public.instant_messages enable row level security;

-- Policies staff/superuser (idempotentes).
drop policy if exists p_courses_staff_select on public.courses;
create policy p_courses_staff_select on public.courses for select to authenticated using (public.is_staff());
drop policy if exists p_courses_staff_insert on public.courses;
create policy p_courses_staff_insert on public.courses for insert to authenticated with check (public.is_staff());
drop policy if exists p_courses_staff_update on public.courses;
create policy p_courses_staff_update on public.courses for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_courses_superuser_delete on public.courses;
create policy p_courses_superuser_delete on public.courses for delete to authenticated using (public.is_superuser());

drop policy if exists p_students_staff_select on public.students;
create policy p_students_staff_select on public.students for select to authenticated using (public.is_staff());
drop policy if exists p_students_staff_insert on public.students;
create policy p_students_staff_insert on public.students for insert to authenticated with check (public.is_staff());
drop policy if exists p_students_staff_update on public.students;
create policy p_students_staff_update on public.students for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_students_superuser_delete on public.students;
create policy p_students_superuser_delete on public.students for delete to authenticated using (public.is_superuser());

drop policy if exists p_absences_staff_select on public.absences;
create policy p_absences_staff_select on public.absences for select to authenticated using (public.is_staff());
drop policy if exists p_absences_staff_insert on public.absences;
create policy p_absences_staff_insert on public.absences for insert to authenticated with check (public.is_staff());
drop policy if exists p_absences_staff_update on public.absences;
create policy p_absences_staff_update on public.absences for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_absences_superuser_delete on public.absences;
create policy p_absences_superuser_delete on public.absences for delete to authenticated using (public.is_superuser());

drop policy if exists p_tests_staff_select on public.tests;
create policy p_tests_staff_select on public.tests for select to authenticated using (public.is_staff());
drop policy if exists p_tests_staff_insert on public.tests;
create policy p_tests_staff_insert on public.tests for insert to authenticated with check (public.is_staff());
drop policy if exists p_tests_staff_update on public.tests;
create policy p_tests_staff_update on public.tests for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_tests_superuser_delete on public.tests;
create policy p_tests_superuser_delete on public.tests for delete to authenticated using (public.is_superuser());

drop policy if exists p_inspectorate_staff_select on public.inspectorate_records;
create policy p_inspectorate_staff_select on public.inspectorate_records for select to authenticated using (public.is_staff());
drop policy if exists p_inspectorate_staff_insert on public.inspectorate_records;
create policy p_inspectorate_staff_insert on public.inspectorate_records for insert to authenticated with check (public.is_staff());
drop policy if exists p_inspectorate_staff_update on public.inspectorate_records;
create policy p_inspectorate_staff_update on public.inspectorate_records for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_inspectorate_superuser_delete on public.inspectorate_records;
create policy p_inspectorate_superuser_delete on public.inspectorate_records for delete to authenticated using (public.is_superuser());

drop policy if exists p_feriados_staff_select on public.feriados_chile;
create policy p_feriados_staff_select on public.feriados_chile for select to authenticated using (public.is_staff());
drop policy if exists p_feriados_staff_insert on public.feriados_chile;
create policy p_feriados_staff_insert on public.feriados_chile for insert to authenticated with check (public.is_staff());
drop policy if exists p_feriados_staff_update on public.feriados_chile;
create policy p_feriados_staff_update on public.feriados_chile for update to authenticated using (public.is_staff()) with check (public.is_staff());
drop policy if exists p_feriados_superuser_delete on public.feriados_chile;
create policy p_feriados_superuser_delete on public.feriados_chile for delete to authenticated using (public.is_superuser());

drop policy if exists p_profiles_self_select on public.profiles;
create policy p_profiles_self_select on public.profiles for select to authenticated using (auth.uid() = user_id);
drop policy if exists p_profiles_superuser_select on public.profiles;
create policy p_profiles_superuser_select on public.profiles for select to authenticated using (public.is_superuser());
drop policy if exists p_profiles_superuser_insert on public.profiles;
create policy p_profiles_superuser_insert on public.profiles for insert to authenticated with check (public.is_superuser());
drop policy if exists p_profiles_superuser_update on public.profiles;
create policy p_profiles_superuser_update on public.profiles for update to authenticated using (public.is_superuser()) with check (public.is_superuser());
drop policy if exists p_profiles_superuser_delete on public.profiles;
create policy p_profiles_superuser_delete on public.profiles for delete to authenticated using (public.is_superuser());
