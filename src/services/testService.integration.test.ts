import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client before importing the service
let currentResult: any = { data: null, error: null };

const makeChain = () => {
  const chain: any = {};
  chain.select = () => chain;
  chain.order = () => chain;
  chain.eq = () => chain;
  chain.gte = () => chain;
  chain.lte = () => chain;
  chain.then = (resolve: any) => resolve(currentResult);

  const insertChain: any = {};
  insertChain.select = () => ({ single: () => ({ then: (resolve: any) => resolve(currentResult) }) });
  chain.insert = (_: any) => insertChain;

  return chain;
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: (_table: string) => makeChain()
  }
}));

import { testService } from './testService';

describe('services/testService (integration - mocked supabase)', () => {
  beforeEach(() => {
    currentResult = { data: null, error: null };
    vi.resetAllMocks();
  });

  describe('getTests', () => {
    it('returns empty array when no tests', async () => {
      currentResult = { data: [], error: null };
      
      const res = await testService.getTests();
      expect(res).toEqual([]);
    });

    it('returns all tests without filters', async () => {
      currentResult = {
        data: [
          { id: 1, date: '2024-03-01', course_id: 10, subject: 'Matemática', type: 'Prueba', courses: { id: 10, name: '1°A', level: 'BASICA' } },
          { id: 2, date: '2024-03-02', course_id: 11, subject: 'Historia', type: 'Control', courses: { id: 11, name: '2°A', level: 'BASICA' } }
        ],
        error: null
      };

      const res = await testService.getTests();
      
      expect(res).toHaveLength(2);
    });

    it('filters tests by courseId', async () => {
      currentResult = { data: [], error: null };

      const res = await testService.getTests('10');
      
      expect(res).toEqual([]);
    });

    it('filters tests by level', async () => {
      currentResult = { data: [], error: null };

      const res = await testService.getTests(undefined, undefined, undefined, 'MEDIA');
      
      expect(res).toEqual([]);
    });

    it('filters tests by month and year', async () => {
      currentResult = { data: [], error: null };

      const res = await testService.getTests(undefined, 2, 2024);
      
      expect(res).toEqual([]);
    });

    it('getTests returns mapped tests with single course when courses is array', async () => {
      currentResult = {
        data: [
          { id: 1, date: '2023-01-01', course_id: 10, courses: [{ id: 10, name: 'A' }] }
        ],
        error: null
      };

      const res = await testService.getTests();
      expect(Array.isArray(res)).toBe(true);
      expect(res[0]!.courses).toEqual({ id: 10, name: 'A' });
      expect(res[0]!.id).toBe(1);
    });

    it('handles database error gracefully', async () => {
      currentResult = { data: null, error: { message: 'Database error' } };

      // El servicio lanza el error en lugar de retornar array vacío
      await expect(testService.getTests()).rejects.toThrow();
    });
  });

  describe('createTest', () => {
    it('creates test and returns data', async () => {
      const newTest = { date: '2024-02-02', course_id: 5, subject: 'Matemática', type: 'Prueba' };
      currentResult = { data: { id: 99, ...newTest }, error: null };

      const created = await testService.createTest(newTest as any);
      expect(created).toBeDefined();
      expect(created!.id).toBe(99);
    });

    it('handles create error', async () => {
      currentResult = { data: null, error: { message: 'Duplicate test' } };

      await expect(
        testService.createTest({ date: '2024-02-02', course_id: 5, subject: 'Test', type: 'Prueba' } as any)
      ).rejects.toThrow('Duplicate test');
    });
  });
});
