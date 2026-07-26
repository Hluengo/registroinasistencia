-- Remove the legacy three-argument overload so PostgREST can resolve the
-- teacher absence RPC deterministically, including when p_course_id is null.

DROP FUNCTION IF EXISTS public.teacher_get_public_absences(integer, integer, text);

COMMENT ON FUNCTION public.teacher_get_public_absences(integer, integer, text, uuid)
IS 'Canonical teacher public absences RPC. Optional p_course_id supports both unfiltered and course-filtered teacher views without PostgREST overload ambiguity.';
