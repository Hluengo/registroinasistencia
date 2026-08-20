import { supabase } from './supabaseClient'
import { Test, Course } from '../types'
import { Database } from '../types/db'

export const testService = {
  getTests: async (
    courseId?: string,
    month?: number,
    year?: number,
    level?: 'BASICA' | 'MEDIA'
  ): Promise<(Test & { courses: Course | null })[]> => {
    // First, get the tests
    let query = supabase
      .from('tests')
      .select('*, courses!inner(*)')
      .order('date')

    if (courseId) {
      const parsed = /^\d+$/.test(String(courseId))
        ? Number(courseId)
        : courseId
      query = query.eq('course_id', String(parsed))
    }
    if (level) query = query.eq('courses.level', level)

    if (month !== undefined && year !== undefined) {
      const monthStr = String(month + 1).padStart(2, '0')
      const startDate = `${year}-${monthStr}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`
      query = query.gte('date', startDate).lte('date', endDate)
    }

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((item) => ({
      ...item,
      courses: Array.isArray(item.courses) ? item.courses[0] : item.courses,
    })) as (Test & { courses: Course | null })[]
  },

  createTest: async (test: Database['public']['Tables']['tests']['Insert']) => {
    const { data, error } = await supabase
      .from('tests')
      .insert(test)
      .select()
      .single()
    if (error) throw error
    return data
  },

  bulkInsertTests: async (
    tests: Database['public']['Tables']['tests']['Insert'][]
  ) => {
    const courseIds = [
      ...new Set(
        tests
          .map((test) => test.course_id)
          .filter((id): id is string => Boolean(id))
      ),
    ]
    const { data: existing, error: existingError } = await supabase
      .from('tests')
      .select('course_id, date, subject, type')
      .in('course_id', courseIds)
    if (existingError) throw existingError

    const existingKeys = new Set(
      (existing ?? []).map(
        (test) =>
          `${test.course_id}|${test.date}|${test.subject.toLowerCase()}|${test.type.toLowerCase()}`
      )
    )
    const duplicate = tests.find((test) =>
      existingKeys.has(
        `${test.course_id}|${test.date}|${test.subject.toLowerCase()}|${test.type.toLowerCase()}`
      )
    )
    if (duplicate)
      throw new Error(
        `Ya existe una prueba para ${duplicate.date}: ${duplicate.subject}`
      )

    const { data, error } = await supabase.from('tests').insert(tests).select()
    if (error) throw error
    return data
  },
}
