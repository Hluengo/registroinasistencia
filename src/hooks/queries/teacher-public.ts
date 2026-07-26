import { supabase } from '../../services/supabaseClient'
import { useQ, queryKeys } from './utils'
import { TeacherPublicAbsence, TeacherPublicAbsenceDetail } from './types'

export const useTeacherPublicAbsences = (
  month: number,
  year: number,
  level?: 'BASICA' | 'MEDIA',
  courseId?: string,
  enabled = true
) => {
  return useQ<TeacherPublicAbsence[]>(
    queryKeys.teacherPublicAbsences(month, year, level, courseId),
    async () => {
      // Always send p_course_id, even when no course is selected. Supabase currently
      // has both 3-argument and 4-argument overloads of this RPC; including this key
      // makes PostgREST select the intended 4-argument function unambiguously.
      const params: {
        p_month: number
        p_year: number
        p_level?: string
        p_course_id: string | null
      } = {
        p_month: month + 1,
        p_year: year,
        p_course_id: courseId || null,
      }
      if (level) params.p_level = level

      const { data, error } = await supabase.rpc('teacher_get_public_absences', params)
      if (error) throw error
      return (data || []) as TeacherPublicAbsence[]
    },
    {
      enabled,
      placeholderData: (previousData) => previousData,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  )
}

export const useTeacherPublicAbsenceDetail = (absenceId?: string, enabled = true) => {
  return useQ<TeacherPublicAbsenceDetail[]>(
    queryKeys.teacherPublicAbsenceDetail(absenceId),
    async () => {
      if (!absenceId) return []
      const { data, error } = await supabase.rpc('teacher_get_public_absence_detail', {
        p_absence_id: absenceId,
      })
      if (error) throw error
      return (data || []) as TeacherPublicAbsenceDetail[]
    },
    {
      enabled: enabled && Boolean(absenceId),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }
  )
}
