import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client before importing the service
let mockRecordsData: any = { data: null, error: null };
let mockInsertData: any = { data: null, error: null };

const makeRecordsChain = () => {
  const chain: any = {};
  chain.select = () => chain;
  chain.order = () => chain;
  chain.eq = () => chain;
  chain.gte = () => chain;
  chain.lte = () => chain;
  chain.then = (resolve: any) => resolve(mockRecordsData);

  // INSERT chain
  const insertChain: any = {};
  insertChain.select = () => ({ single: () => ({ then: (resolve: any) => resolve(mockInsertData) }) });
  chain.insert = (_: any) => insertChain;

  return chain;
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: (_table: string) => makeRecordsChain()
  }
}));

import { inspectorateService } from './inspectorateService';

describe('services/inspectorateService (integration - mocked supabase)', () => {
  beforeEach(() => {
    mockRecordsData = { data: null, error: null };
    mockInsertData = { data: null, error: null };
    vi.resetAllMocks();
  });

  describe('getInspectorateRecords', () => {
    it('returns empty array when no records', async () => {
      mockRecordsData = { data: [], error: null };
      
      const result = await inspectorateService.getInspectorateRecords();
      expect(result).toEqual([]);
    });

    it('returns all records without filters', async () => {
      mockRecordsData = {
        data: [
          {
            id: 'r1',
            student_id: 's1',
            date_time: '2024-03-01T10:00:00Z',
            observation: 'Retardo',
            students: {
              id: 's1',
              full_name: 'Juan Pérez',
              course_id: 'c1',
              courses: { id: 'c1', name: '1°A', level: 'BASICA' }
            }
          },
          {
            id: 'r2',
            student_id: 's2',
            date_time: '2024-03-02T11:00:00Z',
            observation: 'Falta',
            students: {
              id: 's2',
              full_name: 'Ana López',
              course_id: 'c2',
              courses: { id: 'c2', name: '2°A', level: 'BASICA' }
            }
          }
        ],
        error: null
      };

      const result = await inspectorateService.getInspectorateRecords();
      
      expect(result).toHaveLength(2);
      expect(result[0]!.student.full_name).toBe('Juan Pérez');
    });

    it('filters records by level', async () => {
      mockRecordsData = { data: [], error: null };

      const result = await inspectorateService.getInspectorateRecords('MEDIA');
      
      expect(result).toEqual([]);
    });

    it('filters records by start date', async () => {
      mockRecordsData = { data: [], error: null };

      const result = await inspectorateService.getInspectorateRecords(undefined, '2024-03-01');
      
      expect(result).toEqual([]);
    });

    it('filters records by end date', async () => {
      mockRecordsData = { data: [], error: null };

      const result = await inspectorateService.getInspectorateRecords(undefined, undefined, '2024-03-31');
      
      expect(result).toEqual([]);
    });

    it('filters records by date range', async () => {
      mockRecordsData = { data: [], error: null };

      const result = await inspectorateService.getInspectorateRecords(undefined, '2024-03-01', '2024-03-31');
      
      expect(result).toEqual([]);
    });

    it('throws error when database returns error', async () => {
      mockRecordsData = { data: null, error: { message: 'Database error' } };

      await expect(inspectorateService.getInspectorateRecords()).rejects.toThrow('Database error');
    });

    it('maps students to student property correctly', async () => {
      mockRecordsData = {
        data: [
          {
            id: 'r1',
            student_id: 's1',
            date_time: '2024-03-01T10:00:00Z',
            observation: 'Retardo',
            students: {
              id: 's1',
              full_name: 'Juan Pérez',
              course_id: 'c1',
              courses: { id: 'c1', name: '1°A', level: 'BASICA' }
            }
          }
        ],
        error: null
      };

      const result = await inspectorateService.getInspectorateRecords();
      
      expect(result[0]!).toHaveProperty('student');
      expect(result[0]!.student.full_name).toBe('Juan Pérez');
      expect(result[0]!.student.course.name).toBe('1°A');
    });
  });

  describe('createInspectorateRecord', () => {
    it('creates record and returns data', async () => {
      const newRecord = {
        student_id: 's1',
        date_time: '2024-03-15T10:00:00',
        observation: 'Nueva observación'
      };
      
      mockInsertData = { 
        data: { id: 'new-r1', ...newRecord }, 
        error: null 
      };

      const result = await inspectorateService.createInspectorateRecord(newRecord as any);
      
      expect(result).toBeDefined();
      expect(result!.id).toBe('new-r1');
    });

    it('handles insert error', async () => {
      mockInsertData = { data: null, error: { message: 'Foreign key violation' } };

      await expect(
        inspectorateService.createInspectorateRecord({
          student_id: 'nonexistent',
          date_time: '2024-03-15T10:00:00',
          observation: 'Test'
        } as any)
      ).rejects.toThrow('Foreign key violation');
    });
  });
});
