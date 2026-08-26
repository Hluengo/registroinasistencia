import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  makeupExamService,
  MakeupExamStatus,
} from '../../services/makeupExamService'
import { QUERY_KEYS_INVALIDATE } from '../../constants'
import { useQ, queryKeys } from './utils'
import type { MakeupExamInsertRow, MakeupExamUpdateRow } from './types'

export const useMakeupExams = (
  params: {
    month?: number
    year?: number
    level?: 'BASICA' | 'MEDIA'
    courseId?: string
    status?: MakeupExamStatus
    studentId?: string
  } = {}
) =>
  useQ(
    queryKeys.makeupExams(
      params.month,
      params.year,
      params.level,
      params.courseId,
      params.status,
      params.studentId
    ),
    () => makeupExamService.list(params)
  )

const invalidateMakeupExams = (
  queryClient: ReturnType<typeof useQueryClient>
) => {
  queryClient.invalidateQueries({
    queryKey: QUERY_KEYS_INVALIDATE.MAKEUP_EXAMS,
  })
  queryClient.invalidateQueries({
    queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_MAKEUP_EXAMS,
  })
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES })
}

export const useCreateMakeupExam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      input: Omit<
        MakeupExamInsertRow,
        'tenant_id' | 'created_by' | 'updated_by'
      >
    ) => makeupExamService.create(input),
    onSuccess: () => invalidateMakeupExams(queryClient),
  })
}

export const useCreateMakeupExams = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      inputs: Array<
        Omit<MakeupExamInsertRow, 'tenant_id' | 'created_by' | 'updated_by'>
      >
    ) => makeupExamService.createMany(inputs),
    onSuccess: () => invalidateMakeupExams(queryClient),
  })
}

export const useUpdateMakeupExam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Omit<
        MakeupExamUpdateRow,
        'tenant_id' | 'created_by' | 'updated_by'
      >
    }) => makeupExamService.update(id, input),
    onSuccess: () => invalidateMakeupExams(queryClient),
  })
}

export const useDeleteMakeupExam = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => makeupExamService.delete(id),
    onSuccess: () => invalidateMakeupExams(queryClient),
  })
}
