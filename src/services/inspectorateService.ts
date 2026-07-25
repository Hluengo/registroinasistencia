import { supabase } from '../lib/supabaseClient'
import { InspectorateRecord, Student, Course } from '../types'
import { Database } from '../types/db'

export const inspectorateService = {
  getInspectorateRecords: async (
    level?: 'BASICA' | 'MEDIA' | 'BASICA',
    startDate?: string,
    endDate?: string
  ): Promise<
    (InspectorateRecord & { student: Student & { course: Course } })[]
  > => {
    let query = supabase
      .from('inspectorate_records')
      .select(
        'id, student_id, date_time, observation, students!inner(id, full_name, course_id, courses!inner(id, name, level))'
      )
      .order('date_time', { ascending: false })

    if (level) {
      query = query.eq('students.courses.level', level)
    }

    if (startDate) {
      query = query.gte('date_time', startDate)
    }

    if (endDate) {
      query = query.lte('date_time', endDate)
    }

    const { data, error } = await query
    if (error) throw error

    // Map students back to student for compatibility
    type JoinedRow = {
      id: string
      student_id: string | null
      date_time: string
      observation: string
      students: Database['public']['Tables']['students']['Row'] & {
        courses: Database['public']['Tables']['courses']['Row']
      }
    }

    const rows = data as unknown as JoinedRow[]
    return rows.map((rec) => {
      const { students, ...rest } = rec
      const { courses, ...sRest } = students
      return {
        ...rest,
        student: { ...sRest, course: courses },
      } as InspectorateRecord & { student: Student & { course: Course } }
    })
  },

  createInspectorateRecord: async (
    record: Omit<InspectorateRecord, 'id' | 'created_at' | 'tenant_id' | 'type' | 'severity' | 'created_by' | 'pdf_file_path' | 'registered_by'>
  ) => {
    const { data, error } = await supabase
      .from('inspectorate_records')
      .insert({
        ...record,
        tenant_id: '00000000-0000-0000-0000-000000000001',
      } as Database['public']['Tables']['inspectorate_records']['Insert'])
      .select()
      .single()
    if (error) throw error
    return data
  },
}
