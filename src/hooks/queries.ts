import React from 'react';
import { useQuery, QueryKey, UseQueryOptions, UseQueryResult, useMutation, useQueryClient } from '@tanstack/react-query';
import { inspectorateService, absenceService, courseService, studentService, testService, adminService } from '../services';
import { normalizeInspectorateRows } from '../lib/transformations';
import { supabase } from '../services/supabaseClient';
import { QUERY_KEYS_INVALIDATE } from '../constants';
import { 
  AbsenceWithDetails, 
  Test, 
  Absence, 
  Student, 
  Course
} from '../types';
import { Database, Tables, TablesInsert, TablesUpdate, Enums } from '../types/db';
import { normalizeHoliday, filterHolidaysByPeriod, normalizeAbsenceWithDetails, findAffectedTests, groupTestsByCourse, Holiday as NormalizedHoliday } from '../lib/transformations';

type CourseRow = Tables<'courses'>;
type TestRow = Tables<'tests'>;
type StudentRow = Tables<'students'>;
type TestInsertRow = TablesInsert<'tests'>;
type AbsenceUpdateRow = TablesUpdate<'absences'>;
type AbsenceStatus = Enums<'absence_status'>;
type InstantMessageRow = Tables<'instant_messages'>;
type InstantMessageInsertRow = TablesInsert<'instant_messages'>;
type InstantMessageUpdateRow = TablesUpdate<'instant_messages'>;

export type Holiday = NormalizedHoliday;
export type TeacherPublicAbsence = {
  absence_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  course_level: string | null;
  start_date: string;
  end_date: string;
  status: AbsenceStatus;
  observation: string | null;
  affected_tests_count: number;
};

export type TeacherPublicAbsenceDetail = {
  id: string;
  date: string;
  subject: string;
  type: string;
};

export type TeacherInstantMessage = {
  id: string;
  title: string;
  body: string;
  level: string | null;
  course_id: string | null;
  student_id: string | null;
  student_name: string | null;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
};

function useQ<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...(options ?? {})
  });
}

const queryKeys = {
  courses: (level?: string) => ['courses', level ?? 'all'] as const,
  tests: (courseId?: string, month?: number, year?: number, level?: string) => ['tests', courseId ?? 'all', month ?? -1, year ?? -1, level ?? 'all'] as const,
  holidays: (month?: number, year?: number) => ['holidays', month ?? -1, year ?? -1] as const,
  teacherPublicAbsences: (month: number, year: number, level?: string, courseId?: string) => ['teacherPublicAbsences', month, year, level ?? 'all', courseId ?? 'all'] as const,
  teacherPublicAbsenceDetail: (absenceId?: string) => ['teacherPublicAbsenceDetail', absenceId ?? 'none'] as const,
  teacherInstantMessages: (level?: string, courseId?: string) => ['teacherInstantMessages', level ?? 'all', courseId ?? 'all'] as const,
  instantMessagesManage: (level?: string) => ['instantMessagesManage', level ?? 'all'] as const,
  absences: (level?: string, start?: string, end?: string) => ['absences', level ?? 'all', start ?? 'none', end ?? 'none'] as const,
  students: (courseId?: string, level?: string) => ['students', courseId ?? 'all', level ?? 'all'] as const,
  inspectorate: (level?: string, start?: string, end?: string) => ['inspectorate', level ?? 'all', start ?? 'none', end ?? 'none'] as const
};

export const useCourses = (level?: 'BASICA' | 'MEDIA', enabled: boolean = true) => {
  return useQ<CourseRow[]>(
    queryKeys.courses(level),
    async () => {
      let query = supabase.from('courses').select('id, name, level, position').order('position');
      if (level) query = query.eq('level', level);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CourseRow[];
    },
    { enabled }
  );
};

export const useTests = (courseId?: string, month?: number, year?: number, level?: 'BASICA' | 'MEDIA') => {
  return useQ<TestRow[]>(
    queryKeys.tests(courseId, month, year, level),
    async () => {
      let query = supabase
        .from('tests')
        .select('id, course_id, date, subject, type, description, created_at, courses!inner(id, name, level)')
        .order('date');
      if (courseId) {
        const parsed = /^\d+$/.test(String(courseId)) ? Number(courseId) : courseId;
        query = query.eq('course_id', String(parsed));
      }
      if (level) query = query.eq('courses.level', level);
      if (month !== undefined && year !== undefined) {
        const monthStr = String(month + 1).padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;
        query = query.gte('date', startDate).lte('date', endDate);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as TestRow[];
    }
  );
};

export const useHolidays = (month?: number, year?: number) => {
  return useQ<Holiday[]>(
    queryKeys.holidays(month, year),
    async () => {
      const { data, error } = await supabase.from('feriados_chile').select('fecha, descripcion, es_irrenunciable');
      if (error) throw error;
      
      const normalized = (data || [])
        .map(normalizeHoliday)
        .filter((h): h is Holiday => h !== null);

      return filterHolidaysByPeriod(normalized, month, year);
    }
  );
};

export const useTeacherPublicAbsences = (month: number, year: number, level?: 'BASICA' | 'MEDIA', courseId?: string) => {
  return useQ<TeacherPublicAbsence[]>(
    queryKeys.teacherPublicAbsences(month, year, level, courseId),
    async () => {
      const params: { p_month: number; p_year: number; p_level?: string; p_course_id?: string } = {
        p_month: month + 1,
        p_year: year
      };
      if (level) params.p_level = level;
      if (courseId) params.p_course_id = courseId;
      const { data, error } = await supabase.rpc('teacher_get_public_absences', {
        ...params
      });
      if (error) throw error;
      return (data || []) as TeacherPublicAbsence[];
    },
    {
      // Keep previous results on month/year/course changes to avoid UI blanking.
      placeholderData: (previousData) => previousData,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
      refetchOnMount: true
    }
  );
};

export const useTeacherPublicAbsenceDetail = (absenceId?: string) => {
  return useQ<TeacherPublicAbsenceDetail[]>(
    queryKeys.teacherPublicAbsenceDetail(absenceId),
    async () => {
      if (!absenceId) return [];
      const { data, error } = await supabase.rpc('teacher_get_public_absence_detail', {
        p_absence_id: absenceId
      });
      if (error) throw error;
      return (data || []) as TeacherPublicAbsenceDetail[];
    },
    {
      enabled: Boolean(absenceId),
      staleTime: 60_000,
      refetchOnWindowFocus: false
    }
  );
};

export const useTeacherInstantMessages = (level?: 'BASICA' | 'MEDIA', courseId?: string, enabled: boolean = true) => {
  return useQ<TeacherInstantMessage[]>(
    queryKeys.teacherInstantMessages(level, courseId),
    async () => {
      const params: { p_level?: string; p_course_id?: string } = {};
      if (level) params.p_level = level;
      if (courseId) params.p_course_id = courseId;
      const { data, error } = await supabase.rpc('teacher_get_instant_messages', params);
      if (error) throw error;
      return (data || []) as TeacherInstantMessage[];
    },
    {
      staleTime: 30_000,
      refetchInterval: 15_000,
      enabled
    }
  );
};

export const useManageInstantMessages = (level?: 'BASICA' | 'MEDIA', enabled: boolean = true) => {
  return useQ<InstantMessageRow[]>(
    queryKeys.instantMessagesManage(level),
    async () => {
      let query = supabase
        .from('instant_messages')
        .select('id, title, body, level, course_id, student_id, is_active, starts_at, ends_at, created_at, updated_at, created_by')
        .order('created_at', { ascending: false });
      if (level) {
        query = query.or(`level.eq.${level},level.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as InstantMessageRow[];
    },
    { enabled }
  );
};

// Holiday is exported above

type AbsenceWithStudent = Absence & {
  students: Database['public']['Tables']['students']['Row'] & { courses: Database['public']['Tables']['courses']['Row'] }
};

export const useAbsences = (level?: 'BASICA' | 'MEDIA', startDate?: string, endDate?: string) => {
  return useQ<AbsenceWithDetails[]>(
    queryKeys.absences(level, startDate, endDate),
    async () => {
      let query = supabase.from('absences')
        .select(`
          id, student_id, start_date, end_date, observation, document_url, status,
          students!inner (
            id, full_name, course_id, rut,
            courses!inner (id, name, level)
          )
        `)
        .order('start_date', { ascending: false });
      if (level) query = query.eq('students.courses.level', level);
      if (startDate && endDate) {
        // Overlap logic: include absences that intersect the selected period.
        query = query.lte('start_date', endDate).gte('end_date', startDate);
      } else if (startDate) {
        query = query.gte('start_date', startDate);
      } else if (endDate) {
        query = query.lte('end_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as unknown as AbsenceWithStudent[];
      const result = level
        ? rows.filter((r) => r.students?.courses?.level === level)
        : rows;
      if (result.length === 0) return [];

      const relevantCourseIds = Array.from(
        new Set(
          result
            .map((r) => r.students?.course_id)
            .filter((id): id is string => Boolean(id))
        )
      );
      if (relevantCourseIds.length === 0) {
        return result.map((absence) => normalizeAbsenceWithDetails(absence, []));
      }

      let testsQuery = supabase
        .from('tests')
        .select('id, course_id, date, subject, type')
        .in('course_id', relevantCourseIds);

      if (startDate && endDate) {
        testsQuery = testsQuery.gte('date', startDate).lte('date', endDate);
      } else if (startDate) {
        testsQuery = testsQuery.gte('date', startDate);
      } else if (endDate) {
        testsQuery = testsQuery.lte('date', endDate);
      }

      const { data: scopedTests, error: scopedTestsErr } = await testsQuery;

      if (scopedTestsErr) throw scopedTestsErr;

      const tests = (scopedTests || []) as Test[];
      const testsByCourse = groupTestsByCourse(tests);

      return result.map((absence) => {
        const courseTests = testsByCourse[absence.students.course_id ?? ''] || [];
        const affected = findAffectedTests(courseTests, absence.start_date, absence.end_date);
        return normalizeAbsenceWithDetails(absence, affected);
      });
    }
  );
};

export const useStudents = (courseId?: string, level?: 'BASICA' | 'MEDIA', enabled: boolean = true) => {
  const result = useQ<StudentRow[]>(
    queryKeys.students(courseId, level),
    async () => {
      let query = supabase.from('students').select('id, full_name, course_id, rut, courses!inner(id, name, level)').order('full_name');
      if (courseId) {
        const parsed = /^\d+$/.test(String(courseId)) ? Number(courseId) : courseId;
        query = query.eq('course_id', String(parsed));
      }
      if (level) query = query.eq('courses.level', level);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as StudentRow[];
    },
    { enabled }
  );

  // Efficiently memoize the returned data array by comparing a compact
  // key built from the items' ids. If the set/order of ids hasn't
  // changed we return the previous array reference to keep identity
  // stable and avoid unnecessary renders or state updates.
  const lastRef = React.useRef<{
    key: string;
    data: StudentRow[];
  } | null>(null);

  const memoData = React.useMemo(() => {
    const data = result.data ?? [];
    const key = data.length === 0 ? '' : data.map(d => d.id).join('|');
    if (lastRef.current && lastRef.current.key === key) return lastRef.current.data;
    lastRef.current = { key, data };
    return data;
  }, [result.data]);

  return { ...result, data: memoData } as UseQueryResult<StudentRow[]>;
};

export type InspectorateWithStudent = {
  id: string;
  student_id: string | null;
  created_at: string | null;
  date_time: string;
  observation: string;
  student: Student & { course: Course };
};

export const useInspectorate = (level?: 'BASICA' | 'MEDIA', startDate?: string, endDate?: string): UseQueryResult<InspectorateWithStudent[], unknown> => {
  return useQ<InspectorateWithStudent[]>(
    queryKeys.inspectorate(level, startDate, endDate),
    async () => {
      let query = supabase
        .from('inspectorate_records')
        .select('id, student_id, created_at, date_time, observation, students!inner(id, full_name, course_id, rut, courses!inner(id, name, level, position))')
        .order('date_time', { ascending: false });
      if (startDate) query = query.gte('date_time', startDate);
      if (endDate) query = query.lte('date_time', endDate);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data || []) as unknown as Array<Record<string, unknown>>;
      const normalized = normalizeInspectorateRows(rows);
      if (!level) return normalized;
      return normalized.filter((r) => r.student.course?.level === level);
    }
  );
};

export const useStudentDetails = (studentId?: string, enabled: boolean = true) => {
  return useQ<{
    absences: Database['public']['Tables']['absences']['Row'][];
    records: Database['public']['Tables']['inspectorate_records']['Row'][];
  }>(
    ['studentDetails', studentId ?? 'none'],
    async () => {
      if (!studentId) return { absences: [], records: [] };
      const [absRes, recRes] = await Promise.all([
        supabase
          .from('absences')
          .select('id, student_id, start_date, end_date, observation, document_url, status, created_at')
          .eq('student_id', studentId)
          .order('start_date', { ascending: false }),
        supabase
          .from('inspectorate_records')
          .select('id, student_id, date_time, observation, created_at')
          .eq('student_id', studentId)
          .order('date_time', { ascending: false })
      ]);

      const absData = absRes.data ?? [];
      const recData = recRes.data ?? [];

      if (absRes.error) throw absRes.error;
      if (recRes.error) throw recRes.error;

      return { absences: absData as Database['public']['Tables']['absences']['Row'][], records: recData as Database['public']['Tables']['inspectorate_records']['Row'][] };
    },
    { enabled: enabled && Boolean(studentId) }
  );
};

// Mutations
export const useCreateInspectorateRecord = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof inspectorateService.createInspectorateRecord>>,
    Error,
    Parameters<typeof inspectorateService.createInspectorateRecord>[0]
  >({
    mutationFn: (payload) => inspectorateService.createInspectorateRecord(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.INSPECTORATE });
      qc.invalidateQueries({ queryKey: ['studentDetails'] });
    }
  });
};

export const useCreateAbsence = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof absenceService.createAbsence>>,
    Error,
    { absence: Parameters<typeof absenceService.createAbsence>[0]; file?: File }
  >({
    mutationFn: (args) => absenceService.createAbsence(args.absence, args.file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_ABSENCES, refetchType: 'all' });
      qc.invalidateQueries({ queryKey: ['studentDetails'] });
    }
  });
};

export const useUpdateAbsence = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof absenceService.updateAbsence>>,
    Error,
    { id: string; updates: Partial<AbsenceUpdateRow>; file?: File }
  >({
    mutationFn: (args) => absenceService.updateAbsence(args.id, args.updates, args.file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_ABSENCES, refetchType: 'all' });
      qc.invalidateQueries({ queryKey: ['studentDetails'] });
    }
  });
};

// Course / Student / Test mutations
export const useBulkInsertCourses = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof courseService.bulkInsertCourses>>,
    Error,
    Parameters<typeof courseService.bulkInsertCourses>[0]
  >({
    mutationFn: (courses) => courseService.bulkInsertCourses(courses),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
    }
  });
};

export const useBulkInsertStudents = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof studentService.bulkInsertStudents>>,
    Error,
    Parameters<typeof studentService.bulkInsertStudents>[0]
  >({
    mutationFn: (students) => studentService.bulkInsertStudents(students),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
    }
  });
};

export const useCreateTest = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof testService.createTest>>,
    Error,
    TestInsertRow
  >({
    mutationFn: (test) => testService.createTest(test),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tests() });
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.ABSENCES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.TEACHER_PUBLIC_ABSENCES, refetchType: 'all' });
    }
  });
};

export const useSeedData = () => {
  const qc = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof adminService.seedData>>,
    Error,
    void
  >({
    mutationFn: () => adminService.seedData(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: queryKeys.tests() });
    }
  });
};

export const useCreateInstantMessage = () => {
  const qc = useQueryClient();
  return useMutation<
    InstantMessageRow,
    Error,
    Omit<InstantMessageInsertRow, 'id' | 'created_at' | 'updated_at'>
  >({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('instant_messages')
        .insert(payload)
        .select('*')
        .single();
      if (error) {
        const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ');
        throw new Error(details || 'No se pudo crear el mensaje instantáneo.');
      }
      return data as InstantMessageRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.TEACHER_INSTANT_MESSAGES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.INSTANT_MESSAGES_MANAGE });
    }
  });
};

export const useUpdateInstantMessage = () => {
  const qc = useQueryClient();
  return useMutation<
    InstantMessageRow,
    Error,
    { id: string; updates: InstantMessageUpdateRow }
  >({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('instant_messages')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ');
        throw new Error(details || 'No se pudo actualizar el mensaje instantáneo.');
      }
      return data as InstantMessageRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.TEACHER_INSTANT_MESSAGES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS_INVALIDATE.INSTANT_MESSAGES_MANAGE });
    }
  });
};
