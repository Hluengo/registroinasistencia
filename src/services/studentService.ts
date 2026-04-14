import { supabase } from './supabaseClient';
import { Student, Absence, InspectorateRecord } from '../types';
import { Database } from '../types/db';
import { ServiceResult, successResult, errorResult } from '../types/service';
import { handleError } from '../utils/error-handler';

export const studentService = {
  getStudents: async (courseId?: string, level?: 'BASICA' | 'MEDIA'): Promise<ServiceResult<Student[]>> => {
    try {
      let query = supabase
        .from('students')
        .select('id, full_name, course_id, rut, created_at, courses!inner(id, name, level)')
        .order('full_name');

      if (courseId) {
        const parsed = /^\d+$/.test(String(courseId)) ? Number(courseId) : courseId;
        query = query.eq('course_id', String(parsed));
      }
      if (level) query = query.eq('courses.level', level);
      
      const { data, error } = await query;
      if (error) throw error;
      return successResult(data as unknown as Student[]);
    } catch (error) {
      console.error('studentService.getStudents failed:', error);
      const msg = handleError(error);
      return errorResult(msg);
    }
  },

  getStudentDetails: async (studentId: string): Promise<ServiceResult<{
    student: Student | null;
    absences: Absence[];
    records: InspectorateRecord[];
  }>> => {
    try {
      const [studentRes, absencesRes, recordsRes] = await Promise.all([
        supabase.from('students').select('id, full_name, course_id, rut, courses(id, name, level)').eq('id', studentId).single(),
        supabase.from('absences').select('id, start_date, end_date, observation, status').eq('student_id', studentId).order('start_date', { ascending: false }),
        supabase.from('inspectorate_records').select('id, date_time, observation').eq('student_id', studentId).order('date_time', { ascending: false })
      ]);

      if (studentRes.error) throw studentRes.error;
      if (absencesRes.error) throw absencesRes.error;
      if (recordsRes.error) throw recordsRes.error;

      return successResult({
        student: studentRes.data as unknown as Student,
        absences: absencesRes.data as Absence[],
        records: recordsRes.data as InspectorateRecord[]
      });
    } catch (error) {
      console.error('studentService.getStudentDetails failed:', error);
      const msg = handleError(error);
      return errorResult(msg, { student: null, absences: [], records: [] });
    }
  },

  bulkInsertStudents: async (students: { full_name: string; course_id: string; rut?: string }[]): Promise<ServiceResult<Student[]>> => {
    try {
      const { data, error } = await supabase.from('students').insert(students as Database['public']['Tables']['students']['Insert'][]).select();
      if (error) throw error;
      return successResult(data as unknown as Student[]);
    } catch (error) {
      console.error('studentService.bulkInsertStudents failed:', error);
      const msg = handleError(error);
      return errorResult(msg);
    }
  }
};
