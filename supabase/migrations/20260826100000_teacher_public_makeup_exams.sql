-- Recuperaciones visibles para docentes autenticados.

create or replace function public.teacher_get_public_makeup_exams(
  p_month integer,
  p_year integer,
  p_level text default null,
  p_course_id uuid default null
)
returns table (
  makeup_exam_id uuid,
  student_name text,
  course_id uuid,
  course_name text,
  course_level text,
  subject text,
  original_date date,
  scheduled_date date,
  status text,
  observation text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_month_start date;
  v_month_end date;
begin
  if auth.uid() is null then
    return;
  end if;
  if p_month is null or p_month < 1 or p_month > 12 then
    raise exception 'p_month must be between 1 and 12';
  end if;
  if p_year is null or p_year < 2000 or p_year > 2100 then
    raise exception 'p_year must be between 2000 and 2100';
  end if;

  v_month_start := make_date(p_year, p_month, 1);
  v_month_end := (v_month_start + interval '1 month - 1 day')::date;

  return query
  select
    m.id,
    s.full_name,
    c.id,
    c.name,
    c.level,
    m.subject,
    m.original_date,
    m.scheduled_date,
    m.status,
    m.notes
  from public.makeup_exams m
  join public.students s
    on s.id = m.student_id
   and s.tenant_id = public.current_tenant_id()
  join public.courses c
    on c.id = s.course_id
   and c.tenant_id = public.current_tenant_id()
  where m.tenant_id = public.current_tenant_id()
    and m.scheduled_date between v_month_start and v_month_end
    and (p_level is null or c.level = p_level)
    and (p_course_id is null or c.id = p_course_id)
  order by m.scheduled_date, s.full_name, m.subject;
end;
$$;

revoke all on function public.teacher_get_public_makeup_exams(integer, integer, text, uuid)
  from public, anon;
grant execute on function public.teacher_get_public_makeup_exams(integer, integer, text, uuid)
  to authenticated;

comment on function public.teacher_get_public_makeup_exams(integer, integer, text, uuid)
is 'Recuperaciones del tenant actual para la Vista Docente autenticada.';
