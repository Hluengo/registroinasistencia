// Domain modules
export { useCourses, useBulkInsertCourses } from './courses'
export { useTests, useCreateTest, useBulkCreateTests } from './tests'
export {
  useMakeupExams,
  useCreateMakeupExam,
  useCreateMakeupExams,
  useUpdateMakeupExam,
  useDeleteMakeupExam,
} from './makeupExams'
export { useAbsences, useCreateAbsence, useUpdateAbsence } from './absences'
export {
  useStudents,
  useStudentDetails,
  useBulkInsertStudents,
} from './students'
export { useInspectorate, useCreateInspectorateRecord } from './inspectorate'
export {
  useTeacherInstantMessages,
  useManageInstantMessages,
  useCreateInstantMessage,
  useUpdateInstantMessage,
} from './messages'
export {
  useTeacherPublicAbsences,
  useTeacherPublicAbsenceDetail,
} from './teacher-public'
export { useHolidays } from './holidays'
export { useSeedData } from './admin'

// Shared types
export type {
  Holiday,
  TeacherPublicAbsence,
  TeacherPublicAbsenceDetail,
  TeacherInstantMessage,
  InspectorateWithStudent,
  PaginatedResult,
} from './types'

// Shared utils (re-exported for advanced consumers)
export { useQ, queryKeys } from './utils'
