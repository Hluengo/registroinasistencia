import type { MakeupExamInsert, Test } from '../types'
import type { MakeupExamStatus } from '../services/makeupExamService'

export type MakeupExamSelection = {
  studentId: string
  scheduledDate: string
  status: MakeupExamStatus
  testIds: string[]
  observation?: string
  manualEntries?: Array<{
    subject: string
    scheduledDate: string
    notes: string
  }>
  testNotes?: Record<string, string>
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
      notes:
        selection.testNotes?.[test.id]?.trim() ||
        selection.observation?.trim() ||
        null,
    })
  }

  for (const manualEntry of selection.manualEntries ?? []) {
    const subject = manualEntry.subject.trim()
    if (!subject) continue
    selectedInputs.push({
      student_id: selection.studentId,
      test_id: null,
      source_absence_id: selection.sourceAbsenceId ?? null,
      original_date: null,
      scheduled_date: manualEntry.scheduledDate,
      subject,
      status: selection.status,
      notes: manualEntry.notes.trim() || null,
    })
  }

  return selectedInputs
}
