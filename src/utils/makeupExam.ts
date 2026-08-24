import type {
  MakeupExamStatus,
  MakeupExamWithDetails,
} from '../services/makeupExamService'

export const MAKEUP_EXAM_STATUS_LABELS: Record<MakeupExamStatus, string> = {
  pendiente: 'Pendiente',
  rendida: 'Rendida',
  justificada: 'Justificada',
  ausente: 'Ausente',
  reprogramada: 'Reprogramada',
}

export const MAKEUP_EXAM_STATUS_OPTIONS: MakeupExamStatus[] = [
  'pendiente',
  'rendida',
  'justificada',
  'ausente',
  'reprogramada',
]

export function summarizeMakeupExams(exams: MakeupExamWithDetails[]) {
  const counts = new Map<string, number>()
  exams.forEach((exam) => {
    const key = `${exam.student_id}|${exam.scheduled_date}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  return {
    total: exams.length,
    pending: exams.filter((exam) => exam.status === 'pendiente').length,
    completed: exams.filter((exam) => exam.status === 'rendida').length,
    conflicts: Array.from(counts.values()).filter((count) => count > 2).length,
  }
}
