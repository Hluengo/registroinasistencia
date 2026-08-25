import type { MakeupExamInsert, Test } from '../types'
import type { MakeupExamStatus } from '../services/makeupExamService'

export type MakeupExamSelection = {
  studentId: string
  scheduledDate: string
  status: MakeupExamStatus
  testIds: string[]
  manualEntries?: Array<{
    subject: string
    originalDate: string
  }>
  sourceAbsenceId?: string | null
}

export const buildMakeupExamInputs = (
  tests: Test[],
  selection: MakeupExamSelection
): Array<Omit<MakeupExamInsert, 'tenant_id' | 'created_by' | 'updated_by'>> => {
  const selectedTestIds = new Set(selection.testIds)
  const selectedInputs: Array<
    Omit<MakeupExamInsert, 'tenant_id' | 'created_by' | 'updated_by'>
  > = []

  for (const test of tests) {
    if (!selectedTestIds.has(test.id)) continue
    selectedInputs.push({
      student_id: selection.studentId,
      test_id: test.id,
      source_absence_id: selection.sourceAbsenceId ?? null,
      original_date: test.date,
      scheduled_date: selection.scheduledDate,
      subject: test.subject,
      status: selection.status,
    })
  }

  for (const manualEntry of selection.manualEntries ?? []) {
    const subject = manualEntry.subject.trim()
    if (!subject) continue
    selectedInputs.push({
      student_id: selection.studentId,
      test_id: null,
      source_absence_id: selection.sourceAbsenceId ?? null,
      original_date: manualEntry.originalDate || null,
      scheduled_date: selection.scheduledDate,
      subject,
      status: selection.status,
    })
  }

  return selectedInputs
}
