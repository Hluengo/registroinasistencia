-- 012_courses_read_access_for_docente_view.sql
-- Permite leer cursos para filtros de Vista Docente sin requerir rol staff.

grant select on table public.courses to anon, authenticated;

drop policy if exists p_courses_public_select on public.courses;
create policy p_courses_public_select
on public.courses
for select
to anon, authenticated
using (true);
