import { supabase } from '../../services/supabaseClient'
import {
  useQueryClient,
  useMutation,
  UseQueryResult,
} from '@tanstack/react-query'
import { inspectorateService } from '../../services/inspectorateService'
import { normalizeInspectorateRows } from '../../lib/transformations'
import { QUERY_KEYS_INVALIDATE } from '../../constants'
import { useQ, queryKeys } from './utils'
import { InspectorateWithStudent } from './types'

export const useInspectorate = (
  level?: 'BASICA' | 'MEDIA',
  startDate?: string,
  endDate?: string
): UseQueryResult<InspectorateWithStudent[], unknown> => {
  return useQ<InspectorateWithStudent[]>(
    queryKeys.inspectorate(level, startDate, endDate),
    async () => {
      let query = supabase
        .from('inspectorate_records')
        .select(
          'id, student_id, created_at, date_time, observation, students!inner(id, full_name, course_id, rut, courses!inner(id, name, level, position))'
        )
        .order('date_time', { ascending: false })
      if (startDate) query = query.gte('date_time', startDate)
      if (endDate) query = query.lte('date_time', endDate)
      const { data, error } = await query
      if (error) throw error
      const rows = (data || []) as unknown as Array<Record<string, unknown>>
      const normalized = normalizeInspectorateRows(rows)
      if (!level) return normalized
      return normalized.filter((r) => r.student.course?.level === level)
    }
  )
}

export const useCreateInspectorateRecord = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof inspectorateService.createInspectorateRecord>>,
    Error,
    Parameters<typeof inspectorateService.createInspectorateRecord>[0]
  >({
    mutationFn: (payload) =>
      inspectorateService.createInspectorateRecord(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.INSPECTORATE })
      qc.invalidateQueries({ queryKey: ['studentDetails'] })
    },
  })
}
