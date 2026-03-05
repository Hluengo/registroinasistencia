import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client before importing the service
let mockStudentsData: any = { data: null, error: null };
let mockAbsencesData: any = { data: null, error: null };
let mockRecordsData: any = { data: null, error: null };
let mockBulkInsertData: any = { data: null, error: null };

const makeStudentsChain = () => {
  const chain: any = {};
  chain.select = () => chain;
  chain.order = () => chain;
  chain.eq = () => chain;
  chain.then = (resolve: any) => resolve(mockStudentsData);

  // INSERT chain
  const insertChain: any = {};
  insertChain.select = () => ({ then: (resolve: any) => resolve(mockBulkInsertData) });
  chain.insert = (_: any) => insertChain;

  return chain;
};

const makeAbsencesChain = () => {
  const chain: any = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.order = () => chain;
  chain.then = (resolve: any) => resolve(mockAbsencesData);
  return chain;
};

const makeRecordsChain = () => {
  const chain: any = {};
  chain.select = () => chain;
  chain.eq = () => chain;
  chain.order = () => chain;
  chain.then = (resolve: any) => resolve(mockRecordsData);
  return chain;
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'students') return makeStudentsChain();
      if (table === 'absences') return makeAbsencesChain();
      if (table === 'inspectorate_records') return makeRecordsChain();
      return makeStudentsChain();
    }
  }
}));

import { studentService } from './studentService';

describe('services/studentService (integration - mocked supabase)', () => {
  beforeEach(() => {
    mockStudentsData = { data: null, error: null };
    mockAbsencesData = { data: null, error: null };
    mockRecordsData = { data: null, error: null };
    mockBulkInsertData = { data: null, error: null };
    vi.resetAllMocks();
  });

  describe('getStudents', () => {
    it('returns empty array when no students', async () => {
      mockStudentsData = { data: [], error: null };
      
      const result = await studentService.getStudents();
      expect(result).toEqual([]);
    });

    it('returns all students without filter', async () => {
      mockStudentsData = {
        data: [
          { id: 's1', full_name: 'Ana Pérez', course_id: 'c1', rut: '11111111-1', courses: { id: 'c1', name: '1°A', level: 'BASICA' } },
          { id: 's2', full_name: 'Juan López', course_id: 'c2', rut: '22222222-2', courses: { id: 'c2', name: '2°A', level: 'BASICA' } }
        ],
        error: null
      };

      const result = await studentService.getStudents();
      
      expect(result).toHaveLength(2);
      expect(result[0]!.full_name).toBe('Ana Pérez');
    });

    it('filters students by courseId', async () => {
      mockStudentsData = { data: [], error: null };

      const result = await studentService.getStudents('c1');
      
      expect(result).toEqual([]);
    });

    it('filters students by level', async () => {
      mockStudentsData = { data: [], error: null };

      const result = await studentService.getStudents(undefined, 'MEDIA');
      
      expect(result).toEqual([]);
    });

    it('handles database error gracefully', async () => {
      mockStudentsData = { data: null, error: { message: 'Database error' } };

      // El servicio lanza el error en lugar de retornar array vacío
      await expect(studentService.getStudents()).rejects.toThrow();
    });
  });


  describe('bulkInsertStudents', () => {
    it('inserts multiple students and returns data', async () => {
      const students = [
        { full_name: 'Pedro Gómez', course_id: 'c1', rut: '33333333-3' },
        { full_name: 'María Ruiz', course_id: 'c1', rut: '44444444-4' }
      ];
      
      mockBulkInsertData = {
        data: [
          { id: 's10', ...students[0] },
          { id: 's11', ...students[1] }
        ],
        error: null
      };

      const result = await studentService.bulkInsertStudents(students);
      
      expect(result).toHaveLength(2);
      expect(result![0]!.id).toBe('s10');
    });

    it('handles insert error', async () => {
      mockBulkInsertData = { data: null, error: { message: 'Duplicate RUT' } };

      await expect(
        studentService.bulkInsertStudents([{ full_name: 'Test', course_id: 'c1', rut: '12345678-9' }])
      ).rejects.toThrow('Duplicate RUT');
    });

    it('returns null when no data returned', async () => {
      mockBulkInsertData = { data: null, error: null };

      const result = await studentService.bulkInsertStudents([{ full_name: 'Test', course_id: 'c1' }]);
      
      expect(result).toBeNull();
    });
  });
});
