import { supabase } from '../../services/supabaseClient'
import { useQ, queryKeys } from './utils'
import { TeacherPublicAbsence, TeacherPublicAbsenceDetail } from './types'

export const useTeacherPublicAbsences = (
  month: number,
  year: number,
  level?: 'BASICA' | 'MEDIA',
  courseId?: string
) => {
  return useQ<TeacherPublicAbsence[]>(
    queryKeys.teacherPublicAbsences(month, year, level, courseId),
    async () => {
      const params: {
        p_month: number
        p_year: number
        p_level?: string
        p_course_id?: string
      } = {
        p_month: month + 1,
        p_year: year,
      }
      if (level) params.p_level = level
      if (courseId) params.p_course_id = courseId
      const { data, error } = await supabase.rpc(
        'teacher_get_public_absences',
        {
          ...params,
        }
      )
      if (error) throw error
      return (data || []) as TeacherPublicAbsence[]
    },
    {
      placeholderData: (previousData) => previousData,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    }
  )
}

export const useTeacherPublicAbsenceDetail = (absenceId?: string) => {
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
      enabled: Boolean(absenceId),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }
  )
}
