-- 011_instant_messages_student_id.sql
-- Permite asociar mensajes instantaneos a un estudiante especifico.

alter table public.instant_messages
  add column if not exists student_id uuid null references public.students(id) on delete set null;

create index if not exists idx_instant_messages_student_id
  on public.instant_messages(student_id);

drop function if exists public.teacher_get_instant_messages(text, uuid);
drop function if exists public.teacher_get_instant_messages(text, uuid, uuid);

create or replace function public.teacher_get_instant_messages(
  p_level text default null,
  p_course_id uuid default null,
  p_student_id uuid default null
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
    m.student_id,
    s.full_name as student_name,
    m.starts_at,
    m.ends_at,
    m.created_at
  from public.instant_messages m
  left join public.students s on s.id = m.student_id
  where m.is_active = true
    and m.starts_at <= now()
    and (m.ends_at is null or m.ends_at >= now())
    and (p_level is null or m.level is null or m.level = p_level)
    and (p_course_id is null or m.course_id is null or m.course_id = p_course_id)
    and (p_student_id is null or m.student_id is null or m.student_id = p_student_id)
  order by m.starts_at desc, m.created_at desc;
$$;

revoke all on function public.teacher_get_instant_messages(text, uuid, uuid) from public;
grant execute on function public.teacher_get_instant_messages(text, uuid, uuid) to anon, authenticated;
