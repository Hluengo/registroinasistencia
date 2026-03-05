-- Diagnóstico rápido para public.instant_messages
-- Ejecutar completo en Supabase SQL Editor.

-- 1) Objetos base
select
  to_regclass('public.instant_messages') as table_exists,
  to_regprocedure('public.teacher_get_instant_messages(text,uuid)') as rpc_exists;

-- 2) Estructura esperada
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'instant_messages'
order by ordinal_position;

-- 3) RLS habilitado
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'instant_messages';

-- 4) Policies activas
select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'instant_messages'
order by policyname;

-- 5) Grants de tabla
select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'instant_messages'
order by grantee, privilege_type;

-- 6) Grants de función RPC
select
  routine_schema,
  routine_name,
  grantee,
  privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = 'teacher_get_instant_messages'
order by grantee, privilege_type;

-- 7) Datos existentes (últimos 20)
select
  id,
  title,
  level,
  is_active,
  starts_at,
  ends_at,
  created_by,
  created_at
from public.instant_messages
order by created_at desc
limit 20;

-- 8) Pruebas de lectura RPC
select count(*) as rpc_general_count
from public.teacher_get_instant_messages(null, null);

select count(*) as rpc_basica_count
from public.teacher_get_instant_messages('BASICA', null);

select count(*) as rpc_media_count
from public.teacher_get_instant_messages('MEDIA', null);

-- 9) Prueba insert/update/delete con rollback (no deja datos)
begin;

insert into public.instant_messages (title, body, level, is_active, starts_at)
values ('[diag] mensaje test', 'diagnóstico insert/update', 'BASICA', true, now())
returning id, title, level, is_active, starts_at;

update public.instant_messages
set body = body || ' ok',
    is_active = true
where title = '[diag] mensaje test'
returning id, body, updated_at;

delete from public.instant_messages
where title = '[diag] mensaje test'
returning id;

rollback;

-- 10) Ayuda: usuarios staff/superuser disponibles en profiles
select
  p.user_id,
  p.role,
  p.created_at
from public.profiles p
where p.role in ('staff', 'superuser')
order by p.created_at desc
limit 20;
