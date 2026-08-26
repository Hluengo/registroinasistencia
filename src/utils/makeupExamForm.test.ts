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
      testNotes: { 'test-1': 'Coordinar con UTP' },
      sourceAbsenceId: 'absence-1',
    })

    expect(result).toHaveLength(2)
    expect(result.map((item) => item.test_id)).toEqual(['test-1', 'test-2'])
    expect(result[0]).toMatchObject({
      student_id: 'student-1',
      source_absence_id: 'absence-1',
      original_date: '2026-08-20',
      subject: 'Matemática',
      notes: 'Coordinar con UTP',
    })
  })

  it('usa la observación general cuando una prueba no tiene observación propia', () => {
    const result = buildMakeupExamInputs(tests, {
      studentId: 'student-1',
      scheduledDate: '2026-08-25',
      status: 'pendiente',
      testIds: ['test-1'],
      observation: 'Coordinar con UTP',
    })

    expect(result[0]?.notes).toBe('Coordinar con UTP')
  })

  it('genera una fila manual sin referencia a prueba', () => {
    const result = buildMakeupExamInputs([], {
      studentId: 'student-1',
      scheduledDate: '2026-08-25',
      status: 'pendiente',
      testIds: [],
      manualEntries: [
        {
          subject: 'Biología',
          scheduledDate: '2026-08-28',
          notes: 'Avisar al apoderado',
        },
      ],
    })

    expect(result).toEqual([
      expect.objectContaining({
        student_id: 'student-1',
        test_id: null,
        original_date: null,
        scheduled_date: '2026-08-28',
        subject: 'Biología',
        notes: 'Avisar al apoderado',
      }),
    ])
  })

  it('conserva las pruebas registradas al agregar una manual', () => {
    const result = buildMakeupExamInputs(tests, {
      studentId: 'student-1',
      scheduledDate: '2026-08-25',
      status: 'pendiente',
      testIds: ['test-1'],
      manualEntries: [
        { subject: 'Biología', scheduledDate: '2026-08-28', notes: '' },
        { subject: 'Física', scheduledDate: '2026-08-29', notes: '' },
      ],
    })

    expect(result.map((item) => item.test_id)).toEqual(['test-1', null, null])
    expect(result.slice(1).map((item) => item.subject)).toEqual([
      'Biología',
      'Física',
    ])
    expect(result.slice(1).map((item) => item.scheduled_date)).toEqual([
      '2026-08-28',
      '2026-08-29',
    ])
  })
})
