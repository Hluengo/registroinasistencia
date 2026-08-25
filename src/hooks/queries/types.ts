import { AbsenceWithDetails, Student, Course } from '../../types'
import { Tables, TablesInsert, TablesUpdate, Enums } from '../../types/db'
import { Holiday as NormalizedHoliday } from '../../lib/transformations'

export type CourseRow = Tables<'courses'>
export type TestRow = Tables<'tests'>
export type StudentRow = Tables<'students'>
export type TestInsertRow = TablesInsert<'tests'>
export type MakeupExamRow = Tables<'makeup_exams'>
export type MakeupExamInsertRow = TablesInsert<'makeup_exams'>
export type MakeupExamUpdateRow = TablesUpdate<'makeup_exams'>
export type AbsenceUpdateRow = TablesUpdate<'absences'>
export type AbsenceStatus = Enums<'absence_status'>
export type InstantMessageRow = Tables<'instant_messages'>
export type InstantMessageInsertRow = TablesInsert<'instant_messages'>
export type InstantMessageUpdateRow = TablesUpdate<'instant_messages'>

export type Holiday = NormalizedHoliday
export type TeacherPublicAbsence = {
  absence_id: string
  student_name: string
  course_id: string
  course_name: string
  course_level: string | null
  start_date: string
  end_date: string
  status: AbsenceStatus
  observation: string | null
  affected_tests_count: number
}

export type TeacherPublicAbsenceDetail = {
  id: string
  date: string
  subject: string
  type: string
}

export type TeacherInstantMessage = {
  id: string
  title: string
  body: string
  level: string | null
  course_id: string | null
  student_id: string | null
  student_name: string | null
  starts_at: string
  ends_at: string | null
  created_at: string
}

export type AbsenceWithStudent = AbsenceWithDetails & {
  students: Tables<'students'> & {
    courses: Tables<'courses'>
  }
}

export type InspectorateWithStudent = {
  id: string
  student_id: string | null
  created_at: string | null
  date_time: string
  observation: string
  student: Student & { course: Course }
}

export type PaginatedResult<T> = {
  data: T
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
