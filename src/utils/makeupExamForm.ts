import type { MakeupExamInsert, Test } from '../types'
import type { MakeupExamStatus } from '../services/makeupExamService'

export type MakeupExamSelection = {
  studentId: string
  scheduledDate: string
  status: MakeupExamStatus
  testIds: string[]
  sourceAbsenceId?: string | null
}

export const buildMakeupExamInputs = (
  tests: Test[],
  selection: MakeupExamSelection
): Array<Omit<MakeupExamInsert, 'tenant_id' | 'created_by' | 'updated_by'>> => {
  const selectedTestIds = new Set(selection.testIds)

  return tests
    .filter((test) => selectedTestIds.has(test.id))
    .map((test) => ({
      student_id: selection.studentId,
      test_id: test.id,
      source_absence_id: selection.sourceAbsenceId ?? null,
      original_date: test.date,
      scheduled_date: selection.scheduledDate,
      subject: test.subject,
      status: selection.status,
    }))
}
