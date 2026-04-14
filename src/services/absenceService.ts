import { supabase } from './supabaseClient';
import { Absence, AbsenceWithDetails } from '../types';
import { AppError, handleError } from '../utils/error-handler';
import { Database } from '../types/db';
import { ABSENCE_STATUS, FILE_CONFIG } from '../constants';
import { uploadFile, validateFile } from '../utils/upload';

export const absenceService = {
  getAbsences: async (filters?: { 
    courseId?: string; 
    startDate?: string; 
    endDate?: string; 
    status?: string; 
    level?: 'BASICA' | 'MEDIA' 
  }) => {
    try {
      let query = supabase
        .from('absences')
        .select(`
          id, student_id, start_date, end_date, observation, document_url, status,
          students!inner (
            id, full_name, course_id, rut,
            courses!inner (id, name, level)
          )
        `)
        .order('start_date', { ascending: false });

      if (filters?.level) {
        query = query.eq('students.courses.level', filters.level);
      }
      if (filters?.courseId) {
        query = query.eq('students.course_id', filters.courseId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate && filters?.endDate) {
        // Overlap logic: start_date <= endDate AND end_date >= startDate
        query = query.lte('start_date', filters.endDate);
        query = query.gte('end_date', filters.startDate);
      } else if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      } else if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      type AbsenceJoined = Database['public']['Tables']['absences']['Row'] & {
        students: Database['public']['Tables']['students']['Row'] & { courses: Database['public']['Tables']['courses']['Row'] }
      };

      const result = data as unknown as AbsenceJoined[];
      if (result.length === 0) return [];

      // Optimize: Only fetch tests for the courses present in the results
      const relevantCourseIds = Array.from(new Set(result.map(a => a.students.course_id)));
      
      const { data: allTests, error: tErr } = await supabase
        .from('tests')
        .select('id, course_id, date, subject, type')
        .in('course_id', relevantCourseIds);
      
      if (tErr) throw tErr;

      // Optimize: Group tests by courseId for O(1) lookup
      const tests = (allTests || []) as Database['public']['Tables']['tests']['Row'][];
      const testsByCourse = tests.reduce((acc, test) => {
        const key = test.course_id ?? '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(test);
        return acc;
      }, {} as Record<string, Database['public']['Tables']['tests']['Row'][]>);

      // Map affected tests efficiently
      return result.map((absence: AbsenceJoined) => {
        const courseTests = testsByCourse[absence.students.course_id ?? ''] || [];
        const affected = courseTests.filter(test => 
          test.date >= absence.start_date && test.date <= absence.end_date
        );
        // Map students back to student and courses to course for compatibility
        const { students, ...rest } = absence;
        const { courses, ...sRest } = students;
        return { 
          ...rest, 
          student: { ...sRest, course: courses }, 
          affected_tests: affected 
        };
      }) as AbsenceWithDetails[];

    } catch (error) {
      console.error('absenceService.getAbsences failed:', error);
      handleError(error);
    }
  },

  createAbsence: async (absence: Database['public']['Tables']['absences']['Insert'], file?: File) => {
    try {
      let document_url = absence.document_url;

      if (file) {
        const validation = validateFile(file);
        if (!validation.valid) {
          throw new AppError(validation.error || 'Archivo inválido', 400, 'VALIDATION_ERROR');
        }

        const uploadResult = await uploadFile(file, FILE_CONFIG.UPLOAD_BUCKET, 'absences');
        if (!uploadResult.success) {
          throw new AppError(uploadResult.error || 'Error al subir archivo', 500, 'UPLOAD_ERROR');
        }
        document_url = uploadResult.publicUrl;
      }

      const insertPayload: Database['public']['Tables']['absences']['Insert'] = {
        ...absence,
        document_url,
        status: document_url ? ABSENCE_STATUS.JUSTIFICADA : ABSENCE_STATUS.PENDIENTE
      };

      const { data, error } = await supabase
        .from('absences')
        .insert(insertPayload)
        .select()
        .single();

      if (error) throw error;
      return { row: data, error: null, success: true };
    } catch (error) {
      console.error('absenceService.createAbsence failed:', error);
      handleError(error);
    }
  },

  updateAbsence: async (id: string, updates: Partial<Absence>, file?: File) => {
    try {
      let document_url = updates.document_url;

      if (file) {
        const validation = validateFile(file);
        if (!validation.valid) {
          throw new AppError(validation.error || 'Archivo inválido', 400, 'VALIDATION_ERROR');
        }

        const uploadResult = await uploadFile(file, FILE_CONFIG.UPLOAD_BUCKET, 'absences');
        if (!uploadResult.success) {
          throw new AppError(uploadResult.error || 'Error al subir archivo', 500, 'UPLOAD_ERROR');
        }
        document_url = uploadResult.publicUrl;
      }

      const finalUpdates: Partial<Database['public']['Tables']['absences']['Update']> = { ...updates };
      if (document_url) {
        finalUpdates.document_url = document_url;
        finalUpdates.status = ABSENCE_STATUS.JUSTIFICADA;
      }

      const { data, error } = await supabase
        .from('absences')
        .update(finalUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { row: data, error: null, success: true };
    } catch (error) {
      console.error('absenceService.updateAbsence failed:', error);
      handleError(error);
    }
  }
};
