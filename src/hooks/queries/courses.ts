import { supabase } from '../../services/supabaseClient'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import { useQ, queryKeys } from './utils'
import { CourseRow } from './types'

export const useCourses = (
  level?: 'BASICA' | 'MEDIA',
  enabled: boolean = true
) => {
  return useQ<CourseRow[]>(
    queryKeys.courses(level),
    async () => {
      let query = supabase
        .from('courses')
        .select('id, name, level, position')
        .order('position')
      if (level) query = query.eq('level', level)
      const { data, error } = await query
      if (error) throw error
      return (data || []) as CourseRow[]
    },
    { enabled }
  )
}

export const useBulkInsertCourses = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof courseService.bulkInsertCourses>>,
    Error,
    Parameters<typeof courseService.bulkInsertCourses>[0]
  >({
    mutationFn: (courses) => courseService.bulkInsertCourses(courses),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] })
    },
  })
}
