-- La tabla no requiere capacidades estructurales para usuarios de la app.
revoke truncate, trigger, references on public.makeup_exams from authenticated;
