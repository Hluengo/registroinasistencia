import React from 'react'
import { supabase } from '../../services/supabaseClient'
import {
  useQueryClient,
  useMutation,
  UseQueryResult,
} from '@tanstack/react-query'
import { studentService } from '../../services/studentService'
import { useQ, queryKeys } from './utils'
import { StudentRow } from './types'

export const useStudents = (
  courseId?: string,
  level?: 'BASICA' | 'MEDIA',
  enabled: boolean = true
) => {
  const result = useQ<StudentRow[]>(
    queryKeys.students(courseId, level),
    async () => {
      let query = supabase
        .from('students')
        .select(
          'id, full_name, course_id, rut, created_at, courses!inner(id, name, level)'
        )
        .order('full_name')
      if (courseId) {
        const parsed = /^\d+$/.test(String(courseId))
          ? Number(courseId)
          : courseId
        query = query.eq('course_id', String(parsed))
      }
      if (level) query = query.eq('courses.level', level)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as unknown as StudentRow[]
    },
    { enabled }
  )

  const memoData = React.useMemo(() => result.data ?? [], [result.data])

  return { ...result, data: memoData } as UseQueryResult<StudentRow[]>
}

export const useStudentDetails = (
  studentId?: string,
  enabled: boolean = true
) => {
  return useQ<{
    absences: import('../../types/db').Database['public']['Tables']['absences']['Row'][]
    records: import('../../types/db').Database['public']['Tables']['inspectorate_records']['Row'][]
  }>(
    ['studentDetails', studentId ?? 'none'],
    async () => {
      if (!studentId) return { absences: [], records: [] }
      const [absRes, recRes] = await Promise.all([
        supabase
          .from('absences')
          .select(
            'id, student_id, start_date, end_date, observation, document_url, status, created_at'
          )
          .eq('student_id', studentId)
          .order('start_date', { ascending: false }),
        supabase
          .from('inspectorate_records')
          .select('id, student_id, date_time, observation, created_at')
          .eq('student_id', studentId)
          .order('date_time', { ascending: false }),
      ])

      const absData = absRes.data ?? []
      const recData = recRes.data ?? []

      if (absRes.error) throw absRes.error
      if (recRes.error) throw recRes.error

      return {
        absences:
          absData as import('../../types/db').Database['public']['Tables']['absences']['Row'][],
        records:
          recData as import('../../types/db').Database['public']['Tables']['inspectorate_records']['Row'][],
      }
    },
    { enabled: enabled && Boolean(studentId) }
  )
}

export const useBulkInsertStudents = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof studentService.bulkInsertStudents>>,
    Error,
    Parameters<typeof studentService.bulkInsertStudents>[0]
  >({
    mutationFn: (students) => studentService.bulkInsertStudents(students),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] })
    },
  })
}
