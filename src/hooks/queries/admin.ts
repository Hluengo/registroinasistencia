import { useQueryClient, useMutation } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { queryKeys } from './utils'

export const useSeedData = () => {
  const qc = useQueryClient()
  return useMutation<
    Awaited<ReturnType<typeof adminService.seedData>>,
    Error,
    void
  >({
    mutationFn: () => adminService.seedData(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] })
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: queryKeys.tests() })
    },
  })
}
