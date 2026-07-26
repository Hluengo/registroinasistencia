import { useQuery, QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';

function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = String((error as { code?: string }).code ?? '');
  const status = String((error as { status?: number | string }).status ?? '');
  const msg = String((error as { message?: string }).message ?? '');
  return (
    code === '401' ||
    code === 'PGRST401' ||
    code === '403' ||
    code === 'PGRST403' ||
    status === '401' ||
    status === '403' ||
    /unauthorized|forbidden/i.test(msg)
  );
}

export function useQ<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: (failureCount, error) => {
      if (isAuthError(error)) return false;
      return failureCount < 1;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...(options ?? {}),
  });
}

export const queryKeys = {
  courses: (level?: string) => ['courses', level ?? 'all'] as const,
  tests: (courseId?: string, month?: number, year?: number, level?: string) =>
    ['tests', courseId ?? 'all', month ?? -1, year ?? -1, level ?? 'all'] as const,
  holidays: (month?: number, year?: number) => ['holidays', month ?? -1, year ?? -1] as const,
  teacherPublicAbsences: (
    month: number,
    year: number,
    level?: string,
    courseId?: string,
    visibility: 'masked' | 'full' = 'masked'
  ) =>
    [
      'teacherPublicAbsences',
      visibility,
      month,
      year,
      level ?? 'all',
      courseId ?? 'all',
    ] as const,
  teacherPublicAbsenceDetail: (absenceId?: string) =>
    ['teacherPublicAbsenceDetail', absenceId ?? 'none'] as const,
  teacherInstantMessages: (
    level?: string,
    courseId?: string,
    visibility: 'public' | 'staff' = 'public'
  ) => ['teacherInstantMessages', visibility, level ?? 'all', courseId ?? 'all'] as const,
  instantMessagesManage: (level?: string) => ['instantMessagesManage', level ?? 'all'] as const,
  absences: (level?: string, start?: string, end?: string) =>
    ['absences', level ?? 'all', start ?? 'none', end ?? 'none'] as const,
  students: (courseId?: string, level?: string) =>
    ['students', courseId ?? 'all', level ?? 'all'] as const,
  inspectorate: (level?: string, start?: string, end?: string) =>
    ['inspectorate', level ?? 'all', start ?? 'none', end ?? 'none'] as const,
};