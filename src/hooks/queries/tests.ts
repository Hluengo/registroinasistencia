import { supabase } from '../../services/supabaseClient'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { testService } from '../../services/testService'
import { QUERY_KEYS_INVALIDATE } from '../../constants'
import { useQ, queryKeys } from './utils'
import { TestRow, TestInsertRow } from './types'

export const useTests = (
  courseId?: string,
  month?: number,
  year?: number,
  level?: 'BASICA' | 'MEDIA'
) => {
  return useQ<TestRow[]>(
    queryKeys.tests(courseId, month, year, level),
    async () => {
      let query = supabase
        .from('tests')
        .select(
          'id, course_id, date, subject, type, description, created_at, courses!inner(id, name, level)'
        )
        .order('date')
      if (courseId) {
        const parsed = /^\d+$/.test(String(courseId))
          ? Number(courseId)
          : courseId
        query = query.eq('course_id', String(parsed))
      }
      if (level) query = query.eq('courses.level', level)
      if (month !== undefined && year !== undefined) {
        const monthStr = String(month + 1).padStart(2, '0')
        const startDate = `${year}-${monthStr}-01`
        const lastDay = new Date(year, month + 1, 0).getDate()
        const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`
        query = query.gte('date', startDate).lte('date', endDate)
      }
      const { data, error } = await query
      if (error) throw error
      return (data || []) as TestRow[]
    }
  )
}

export const useCreateTest = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof testService.createTest>>,
    Error,
    TestInsertRow
  >({
    mutationFn: (test) => testService.createTest(test),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tests() })
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES })
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_ABSENCES,
        refetchType: 'all',
      })
    },
  })
}

export const useBulkCreateTests = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof testService.bulkInsertTests>>,
    Error,
    TestInsertRow[]
  >({
    mutationFn: (tests) => testService.bulkInsertTests(tests),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.TESTS })
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES })
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_ABSENCES,
      })
    },
  })
}
