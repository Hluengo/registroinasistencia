import { supabase } from './supabaseClient'
import { Course } from '../types'
import { Database } from '../types/db'

export const courseService = {
  getCourses: async (level?: 'BASICA' | 'MEDIA'): Promise<Course[]> => {
    let query = supabase
      .from('courses')
      .select('id, name, level')
      .order('position')

    if (level) query = query.eq('level', level)

    const { data, error } = await query
    if (error) throw error
    return data as unknown as Course[]
  },

  bulkInsertCourses: async (
    courses: { name: string; level: 'BASICA' | 'MEDIA' }[]
  ): Promise<Course[]> => {
    const { data, error } = await supabase
      .from('courses')
      .insert(courses as Database['public']['Tables']['courses']['Insert'][])
      .select()

    if (error) throw error
    return data as unknown as Course[]
  },
}
