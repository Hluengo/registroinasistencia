import { describe, expect, it } from 'vitest'
import { buildMakeupCitationDocument } from './makeupExamPrint'
import type { MakeupExamWithDetails } from '../services/makeupExamService'

const exam = {
  id: 'exam-1',
  student_id: 'student-1',
  subject: '<Lenguaje>',
  original_date: '2026-08-20',
  scheduled_date: '2026-08-25',
  scheduled_time: '10:00',
  status: 'pendiente',
  room: 'Sala 2',
  notes: 'Traer guía <firmada>',
  students: {
    id: 'student-1',
    full_name: 'Ana <Segura>',
    rut: null,
    course_id: 'course-1',
    courses: { id: 'course-1', name: '7A', level: 'BASICA' },
  },
} as unknown as MakeupExamWithDetails

describe('buildMakeupCitationDocument', () => {
  it('escapa datos antes de generar una citación', () => {
    const html = buildMakeupCitationDocument(exam, [exam])

    expect(html).toContain('Ana &lt;Segura&gt;')
    expect(html).toContain('Traer guía &lt;firmada&gt;')
    expect(html).not.toContain('Ana <Segura>')
    expect(html).toContain('@page { size: 5.5in 8.5in; margin: 0; }')
    expect(html).toContain('martes, 25 de agosto de 2026')
  })
})
