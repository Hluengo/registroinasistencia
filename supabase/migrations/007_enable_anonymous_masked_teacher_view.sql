create or replace function public.teacher_get_public_absences_masked(
  p_month integer,
  p_year integer,
  p_level text default null,
  p_course_id uuid default null
)
returns table(
  absence_id text,
  student_name text,
  course_id uuid,
  course_name text,
  course_level text,
  start_date date,
  end_date date,
  status text,
  observation text,
  affected_tests_count integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_month_start date;
  v_month_end date;
begin
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
    md5(a.id::text) as absence_id,
    (
      select string_agg(upper(left(name_part, 1)) || '.', ' ' order by part_order)
      from regexp_split_to_table(trim(s.full_name), E'\\s+') with ordinality
        as parts(name_part, part_order)
      where name_part <> ''
    ) as student_name,
    c.id as course_id,
    c.name as course_name,
    c.level as course_level,
    a.start_date,
    a.end_date,
    a.status,
    null::text as observation,
    coalesce(ta.affected_tests_count, 0)::int as affected_tests_count
  from public.absences a
  join public.students s on s.id = a.student_id
  join public.courses c on c.id = s.course_id
  left join lateral (
    select count(*)::int as affected_tests_count
    from public.tests t
    where t.course_id = c.id
      and t.date between a.start_date and a.end_date
      and t.date between v_month_start and v_month_end
  ) ta on true
  where a.start_date <= v_month_end
    and a.end_date >= v_month_start
    and (p_level is null or c.level = p_level)
    and (p_course_id is null or c.id = p_course_id)
  order by a.start_date desc, s.full_name asc;
end;
$function$;

revoke all on function public.teacher_get_public_absences_masked(integer, integer, text, uuid)
  from public;
grant execute on function public.teacher_get_public_absences_masked(integer, integer, text, uuid)
  to anon, authenticated, service_role;

create or replace function public.teacher_get_public_courses(
  p_level text default null
)
returns table(
  id uuid,
  name text,
  level text,
  "position" integer
)
language sql
security definer
set search_path = public, pg_temp
as $function$
  select c.id, c.name, c.level, c.position
  from public.courses c
  where p_level is null or c.level = p_level
  order by c.position, c.name;
$function$;

revoke all on function public.teacher_get_public_courses(text) from public;
grant execute on function public.teacher_get_public_courses(text)
  to anon, authenticated, service_role;