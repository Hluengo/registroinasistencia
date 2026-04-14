import { supabase } from './supabaseClient';
import { Course } from '../types';
import { handleError } from '../utils/error-handler';
import { Database } from '../types/db';
import { ServiceResult, successResult, errorResult } from '../types/service';

export const courseService = {
  getCourses: async (level?: 'BASICA' | 'MEDIA'): Promise<ServiceResult<Course[]>> => {
    try {
      let query = supabase
        .from('courses')
        .select('id, name, level')
        .order('position');

      if (level) query = query.eq('level', level);
      
      const { data, error } = await query;
      if (error) throw error;
      
      return successResult(data as unknown as Course[]);
    } catch (error) {
      console.error('courseService.getCourses failed:', error);
      const msg = handleError(error);
      return errorResult(msg);
    }
  },

  bulkInsertCourses: async (courses: { name: string; level: 'BASICA' | 'MEDIA' }[]): Promise<ServiceResult<Course[]>> => {
    try {
      const { data, error } = await supabase.from('courses').insert(courses as Database['public']['Tables']['courses']['Insert'][]).select();
      if (error) throw error;
      return successResult(data as unknown as Course[]);
    } catch (error) {
      console.error('courseService.bulkInsertCourses failed:', error);
      const msg = handleError(error);
      return errorResult(msg);
    }
  }
};
