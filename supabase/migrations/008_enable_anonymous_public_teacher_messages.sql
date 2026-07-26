create or replace function public.teacher_get_public_instant_messages(
  p_level text default null,
  p_course_id uuid default null
)
returns table (
  id uuid,
  title text,
  body text,
  level text,
  course_id uuid,
  student_id uuid,
  student_name text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id,
    m.title,
    m.body,
    m.level,
    m.course_id,
    null::uuid as student_id,
    null::text as student_name,
    m.starts_at,
    m.ends_at,
    m.created_at
  from public.instant_messages m
  where m.is_active = true
    and m.starts_at <= now()
    and (m.ends_at is null or m.ends_at >= now())
    and m.student_id is null
    and (p_level is null or m.level is null or m.level = p_level)
    and (p_course_id is null or m.course_id is null or m.course_id = p_course_id)
  order by m.starts_at desc, m.created_at desc;
$$;

revoke all on function public.teacher_get_public_instant_messages(text, uuid) from public;
grant execute on function public.teacher_get_public_instant_messages(text, uuid)
  to anon, authenticated, service_role;