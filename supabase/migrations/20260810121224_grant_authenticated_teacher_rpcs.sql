grant execute on function public.teacher_get_instant_messages(text, uuid, uuid)
  to authenticated;

grant execute on function public.teacher_get_public_absence_detail(uuid)
  to authenticated;

grant execute on function public.teacher_get_public_absences(integer, integer, text, uuid)
  to authenticated;
