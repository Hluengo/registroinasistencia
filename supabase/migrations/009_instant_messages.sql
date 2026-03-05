-- 009_instant_messages.sql
-- Mensajes instantáneos para comunicar situaciones particulares en Vista Docente.

create table if not exists public.instant_messages (
  id uuid primary key default uuid_generate_v4(),
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 3 and 1200),
  level text null check (level in ('BASICA', 'MEDIA')),
  course_id uuid null references public.courses(id) on delete set null,
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instant_messages_date_check check (ends_at is null or ends_at >= starts_at)
);

create or replace function public.touch_instant_messages_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_instant_messages_updated_at on public.instant_messages;
create trigger trg_touch_instant_messages_updated_at
before update on public.instant_messages
for each row
execute function public.touch_instant_messages_updated_at();

create index if not exists idx_instant_messages_active_window
  on public.instant_messages(is_active, starts_at desc, ends_at);

create index if not exists idx_instant_messages_level_course
  on public.instant_messages(level, course_id);

create or replace function public.teacher_get_instant_messages(
  p_level text default null,
  p_course_id uuid default null
)
returns table (
  id uuid,
  title text,
  body text,
  level text,
  course_id uuid,
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
    m.starts_at,
    m.ends_at,
    m.created_at
  from public.instant_messages m
  where m.is_active = true
    and m.starts_at <= now()
    and (m.ends_at is null or m.ends_at >= now())
    and (p_level is null or m.level is null or m.level = p_level)
    and (p_course_id is null or m.course_id is null or m.course_id = p_course_id)
  order by m.starts_at desc, m.created_at desc;
$$;

alter table public.instant_messages enable row level security;

drop policy if exists p_instant_messages_staff_select on public.instant_messages;
create policy p_instant_messages_staff_select
on public.instant_messages
for select
to authenticated
using (public.is_staff());

drop policy if exists p_instant_messages_staff_insert on public.instant_messages;
create policy p_instant_messages_staff_insert
on public.instant_messages
for insert
to authenticated
with check (
  public.is_staff()
  and (created_by is null or created_by = auth.uid())
);

drop policy if exists p_instant_messages_staff_update on public.instant_messages;
create policy p_instant_messages_staff_update
on public.instant_messages
for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists p_instant_messages_superuser_delete on public.instant_messages;
create policy p_instant_messages_superuser_delete
on public.instant_messages
for delete
to authenticated
using (public.is_superuser());

grant select, insert, update, delete on public.instant_messages to authenticated;

revoke all on function public.teacher_get_instant_messages(text, uuid) from public;
grant execute on function public.teacher_get_instant_messages(text, uuid) to anon, authenticated;

