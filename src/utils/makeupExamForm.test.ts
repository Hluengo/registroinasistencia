import { describe, expect, it } from 'vitest'
import { buildMakeupExamInputs } from './makeupExamForm'
import type { Test } from '../types'

const tests = [
  {
    id: 'test-1',
    subject: 'Matemática',
    type: 'Prueba',
    date: '2026-08-20',
  },
  {
    id: 'test-2',
    subject: 'Lenguaje',
    type: 'Control',
    date: '2026-08-21',
  },
] as Test[]

describe('buildMakeupExamInputs', () => {
  it('genera una fila por cada prueba seleccionada', () => {
    const result = buildMakeupExamInputs(tests, {
      studentId: 'student-1',
      scheduledDate: '2026-08-25',
      status: 'pendiente',
      testIds: ['test-1', 'test-2'],
      sourceAbsenceId: 'absence-1',
    })

    expect(result).toHaveLength(2)
    expect(result.map((item) => item.test_id)).toEqual(['test-1', 'test-2'])
    expect(result[0]).toMatchObject({
      student_id: 'student-1',
      source_absence_id: 'absence-1',
      original_date: '2026-08-20',
      subject: 'Matemática',
    })
  })
})
