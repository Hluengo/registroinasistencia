-- 006_fix_table_privileges.sql
-- Soluciona errores "permission denied for table ..." cuando la app usa el rol authenticated.
-- RLS sigue siendo la capa de autorización fina; estos GRANT solo habilitan privilegios base.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.absences to authenticated;
grant select, insert, update, delete on public.tests to authenticated;
grant select, insert, update, delete on public.inspectorate_records to authenticated;
grant select, insert, update, delete on public.feriados_chile to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;

-- Mantener anonimato en lectura directa: sin grants de tablas para anon.
-- El acceso público docente ocurre vía RPC SECURITY DEFINER.
