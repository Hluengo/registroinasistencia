import { supabase } from '../../services/supabaseClient'
import {
  useQueryClient,
  useMutation,
  UseQueryResult,
} from '@tanstack/react-query'
import { absenceService } from '../../services/absenceService'
import {
  normalizeAbsenceWithDetails,
  findAffectedTests,
  groupTestsByCourse,
} from '../../lib/transformations'
import { QUERY_KEYS_INVALIDATE } from '../../constants'
import { AbsenceWithDetails, Test } from '../../types'
import { getSignedFileUrl } from '../../utils/upload'
import { useQ, queryKeys } from './utils'
import { AbsenceWithStudent, AbsenceUpdateRow, PaginatedResult } from './types'

export function useAbsences(
  level?: 'BASICA' | 'MEDIA',
  startDate?: string,
  endDate?: string
): UseQueryResult<AbsenceWithDetails[]>
export function useAbsences(
  level: 'BASICA' | 'MEDIA' | undefined,
  startDate: string | undefined,
  endDate: string | undefined,
  page: number,
  pageSize: number
): UseQueryResult<PaginatedResult<AbsenceWithDetails[]>>
export function useAbsences(
  level?: 'BASICA' | 'MEDIA',
  startDate?: string,
  endDate?: string,
  page?: number,
  pageSize?: number
) {
  const isPaginated = page !== undefined && pageSize !== undefined
  const from = isPaginated ? (page - 1) * pageSize : undefined
  const to = isPaginated ? from! + pageSize - 1 : undefined

  return useQ<PaginatedResult<AbsenceWithDetails[]> | AbsenceWithDetails[]>(
    isPaginated
      ? [...queryKeys.absences(level, startDate, endDate), { page, pageSize }]
      : queryKeys.absences(level, startDate, endDate),
    async () => {
      let query = supabase
        .from('absences')
        .select(
          `
          id, student_id, start_date, end_date, observation, document_url, status,
          students!inner (
            id, full_name, course_id, rut,
            courses!inner (id, name, level)
          )
        `,
          { count: isPaginated ? 'exact' : undefined }
        )
        .order('start_date', { ascending: false })
      if (level) query = query.eq('students.courses.level', level)
      if (startDate && endDate) {
        query = query.lte('start_date', endDate).gte('end_date', startDate)
      } else if (startDate) {
        query = query.gte('start_date', startDate)
      } else if (endDate) {
        query = query.lte('end_date', endDate)
      }

      if (isPaginated) {
        query = query.range(from!, to!)
      }

      const { data, error, count } = await query
      if (error) throw error

      const rows = (data || []) as unknown as AbsenceWithStudent[]
      if (rows.length === 0) {
        return isPaginated
          ? {
              data: [],
              totalCount: 0,
              page,
              pageSize,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false,
            }
          : []
      }

      const relevantCourseIds = Array.from(
        new Set(
          rows
            .map((r) => r.students?.course_id)
            .filter((id): id is string => Boolean(id))
        )
      )

      let tests: Test[] = []
      if (relevantCourseIds.length > 0) {
        let testsQuery = supabase
          .from('tests')
          .select('id, course_id, date, subject, type')
          .in('course_id', relevantCourseIds)

        if (startDate && endDate) {
          testsQuery = testsQuery.gte('date', startDate).lte('date', endDate)
        } else if (startDate) {
          testsQuery = testsQuery.gte('date', startDate)
        } else if (endDate) {
          testsQuery = testsQuery.lte('date', endDate)
        }

        const { data: scopedTests, error: scopedTestsErr } = await testsQuery
        if (scopedTestsErr) throw scopedTestsErr
        tests = (scopedTests || []) as Test[]
      }

      const testsByCourse = groupTestsByCourse(tests)

      const result = await Promise.all(
        rows.map(async (absence) => {
          const courseTests =
            testsByCourse[absence.students.course_id ?? ''] || []
          const affected = findAffectedTests(
            courseTests,
            absence.start_date,
            absence.end_date
          )
          const normalized = normalizeAbsenceWithDetails(absence, affected)
          return {
            ...normalized,
            document_url: await getSignedFileUrl(normalized.document_url),
          }
        })
      )

      if (isPaginated) {
        const totalCount = count ?? 0
        const totalPages = Math.ceil(totalCount / pageSize)
        return {
          data: result,
          totalCount,
          page,
          pageSize,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }
      }

      return result
    }
  )
}

export const useCreateAbsence = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof absenceService.createAbsence>>,
    Error,
    { absence: Parameters<typeof absenceService.createAbsence>[0]; file?: File }
  >({
    mutationFn: async (args) => {
      const result = await absenceService.createAbsence(args.absence, args.file)
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES })
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_ABSENCES,
        refetchType: 'all',
      })
      qc.invalidateQueries({ queryKey: ['studentDetails'] })
    },
  })
}

export const useUpdateAbsence = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof absenceService.updateAbsence>>,
    Error,
    { id: string; updates: Partial<AbsenceUpdateRow>; file?: File }
  >({
    mutationFn: async (args) => {
      const result = await absenceService.updateAbsence(
        args.id,
        args.updates,
        args.file
      )
      return result
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES })
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_ABSENCES,
        refetchType: 'all',
      })
      qc.invalidateQueries({ queryKey: ['studentDetails'] })
    },
  })
}
