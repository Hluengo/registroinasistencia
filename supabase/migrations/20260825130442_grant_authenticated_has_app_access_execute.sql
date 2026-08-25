-- Las politicas RLS de makeup_exams consultan esta funcion de autorizacion.
-- Mantener el acceso solo para usuarios autenticados; anon no debe ejecutarla.
grant execute on function public.has_app_access(text, text[])
to authenticated;
