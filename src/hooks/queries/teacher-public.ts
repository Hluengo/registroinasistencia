import { supabase } from '../../services/supabaseClient'
import { useQ, queryKeys } from './utils'
import { TeacherPublicAbsence, TeacherPublicAbsenceDetail } from './types'

export const useTeacherPublicAbsences = (
  month: number,
  year: number,
  level?: 'BASICA' | 'MEDIA',
  courseId?: string,
  isAuthenticated = false
) => {
  const visibility = isAuthenticated ? 'full' : 'masked'

  return useQ<TeacherPublicAbsence[]>(
    queryKeys.teacherPublicAbsences(month, year, level, courseId, visibility),
    async () => {
      const params: {
        p_month: number
        p_year: number
        p_level?: string
        p_course_id?: string
      } = {
        p_month: month + 1,
        p_year: year,
        ...(courseId ? { p_course_id: courseId } : {}),
      }
      if (level) params.p_level = level

      const rpcName = isAuthenticated
        ? 'teacher_get_public_absences'
        : 'teacher_get_public_absences_masked'
      const { data, error } = await supabase.rpc(rpcName, params)
      if (error) throw error
      return (data || []) as TeacherPublicAbsence[]
    },
    {
      enabled: true,
      placeholderData: (previousData) => previousData,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  )
}

export const useTeacherPublicAbsenceDetail = (
  absenceId?: string,
  enabled = true
) => {
  return useQ<TeacherPublicAbsenceDetail[]>(
    queryKeys.teacherPublicAbsenceDetail(absenceId),
    async () => {
      if (!absenceId) return []
      const { data, error } = await supabase.rpc(
        'teacher_get_public_absence_detail',
        {
          p_absence_id: absenceId,
        }
      )
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
