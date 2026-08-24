import { supabase } from './supabaseClient'
import type { MakeupExamInsert, MakeupExamUpdate } from '../types'
import type { Database } from '../types/db'

export type MakeupExamStatus =
  'pendiente' | 'rendida' | 'justificada' | 'ausente' | 'reprogramada'

export type MakeupExamWithDetails =
  Database['public']['Tables']['makeup_exams']['Row'] & {
    students: {
      id: string
      full_name: string
      rut: string | null
      course_id: string | null
      courses: { id: string; name: string; level: string | null } | null
    } | null
  }

const detailsSelect = `
  id, tenant_id, student_id, test_id, source_absence_id, original_date,
  scheduled_date, subject, status, scheduled_time, room, proctor, grade,
  notes, created_by, updated_by, created_at, updated_at,
  students!inner (
    id, full_name, rut, course_id,
    courses!inner (id, name, level)
  )
`

const getMonthBounds = (month?: number, year?: number) => {
  if (month === undefined || year === undefined) return null
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

export const makeupExamService = {
  async list(
    params: {
      month?: number
      year?: number
      level?: 'BASICA' | 'MEDIA'
      courseId?: string
      status?: MakeupExamStatus
      studentId?: string
    } = {}
  ): Promise<MakeupExamWithDetails[]> {
    let query = supabase
      .from('makeup_exams')
      .select(detailsSelect)
      .order('scheduled_date')
      .order('scheduled_time')

    if (params.level) query = query.eq('students.courses.level', params.level)
    if (params.courseId) query = query.eq('students.course_id', params.courseId)
    if (params.status) query = query.eq('status', params.status)
    if (params.studentId) query = query.eq('student_id', params.studentId)

    const bounds = getMonthBounds(params.month, params.year)
    if (bounds)
      query = query
        .gte('scheduled_date', bounds.start)
        .lte('scheduled_date', bounds.end)

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as MakeupExamWithDetails[]
  },

  async create(
    input: Omit<MakeupExamInsert, 'tenant_id' | 'created_by' | 'updated_by'>
  ) {
    const { data, error } = await supabase
      .from('makeup_exams')
      .insert(input)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async createMany(
    inputs: Array<
      Omit<MakeupExamInsert, 'tenant_id' | 'created_by' | 'updated_by'>
    >
  ) {
    if (inputs.length === 0) return []
    const { data, error } = await supabase
      .from('makeup_exams')
      .insert(inputs)
      .select()
    if (error) throw error
    return data
  },

  async update(
    id: string,
    input: Omit<MakeupExamUpdate, 'tenant_id' | 'created_by' | 'updated_by'>
  ) {
    const { data, error } = await supabase
      .from('makeup_exams')
      .update(input)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase.from('makeup_exams').delete().eq('id', id)
    if (error) throw error
  },
}
