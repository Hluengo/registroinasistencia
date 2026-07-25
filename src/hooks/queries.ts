// Barrel re-export from domain modules.
// All hooks and types are now defined in src/hooks/queries/<module>.ts
// This file re-exports everything for backward compatibility.

export {
  // Courses
  useCourses,
  useBulkInsertCourses,

  // Tests
  useTests,
  useCreateTest,

  // Absences
  useAbsences,
  useCreateAbsence,
  useUpdateAbsence,

  // Students
  useStudents,
  useStudentDetails,
  useBulkInsertStudents,

  // Inspectorate
  useInspectorate,
  useCreateInspectorateRecord,

  // Messages
  useTeacherInstantMessages,
  useManageInstantMessages,
  useCreateInstantMessage,
  useUpdateInstantMessage,

  // Teacher public view
  useTeacherPublicAbsences,
  useTeacherPublicAbsenceDetail,

  // Holidays
  useHolidays,

  // Admin
  useSeedData,

  // Shared utils
  useQ,
  queryKeys,
} from './queries/index'

// Types
export type {
  Holiday,
  TeacherPublicAbsence,
  TeacherPublicAbsenceDetail,
  TeacherInstantMessage,
  InspectorateWithStudent,
  PaginatedResult,
} from './queries/index'

// Legacy re-exports of internal types (used by a few files)
export type {
  CourseRow,
  TestRow,
  StudentRow,
  TestInsertRow,
  AbsenceUpdateRow,
  AbsenceStatus,
  InstantMessageRow,
  InstantMessageInsertRow,
  InstantMessageUpdateRow,
} from './queries/types'
