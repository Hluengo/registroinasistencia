import { describe, expect, it } from 'vitest'
import { summarizeMakeupExams } from './makeupExam'

describe('summarizeMakeupExams', () => {
  it('counts status and overloaded student dates', () => {
    const exams = [
      { student_id: 's1', scheduled_date: '2026-08-24', status: 'pendiente' },
      { student_id: 's1', scheduled_date: '2026-08-24', status: 'rendida' },
      { student_id: 's1', scheduled_date: '2026-08-24', status: 'pendiente' },
      { student_id: 's2', scheduled_date: '2026-08-24', status: 'rendida' },
    ] as never[]

    expect(summarizeMakeupExams(exams)).toEqual({
      total: 4,
      pending: 2,
      completed: 2,
      conflicts: 1,
    })
  })
})
