import type { MakeupExamWithDetails } from '../services/makeupExamService'
import { MAKEUP_EXAM_STATUS_LABELS } from './makeupExam'

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const buildMakeupCitationDocument = (
  exam: MakeupExamWithDetails,
  studentExams: MakeupExamWithDetails[]
) => {
  const student = exam.students
  const rows = studentExams
    .slice()
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.subject)}</td>
          <td>${escapeHtml(item.original_date || '-')}</td>
          <td>${escapeHtml(item.scheduled_date)}</td>
          <td>${escapeHtml(item.scheduled_time || '-')}</td>
          <td>${escapeHtml(MAKEUP_EXAM_STATUS_LABELS[item.status as keyof typeof MAKEUP_EXAM_STATUS_LABELS] ?? item.status)}</td>
          <td>${escapeHtml(item.room || '-')}</td>
        </tr>`
    )
    .join('')

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Citación de recuperación - ${escapeHtml(student?.full_name)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #172033; margin: 32px; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 28px; }
          p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #eef2ff; }
          .note { margin-top: 28px; border-top: 1px solid #cbd5e1; padding-top: 16px; }
          @media print { body { margin: 18mm; } }
        </style>
      </head>
      <body>
        <h1>Citación de recuperación</h1>
        <p><strong>Estudiante:</strong> ${escapeHtml(student?.full_name)}</p>
        <p><strong>RUT:</strong> ${escapeHtml(student?.rut || '-')}</p>
        <p><strong>Curso:</strong> ${escapeHtml(student?.courses?.name || '-')}</p>
        <p><strong>Establecimiento:</strong> Registro Escolar</p>
        <h2>Evaluaciones pendientes o reprogramadas</h2>
        <table>
          <thead><tr><th>Asignatura</th><th>Fecha original</th><th>Fecha recuperación</th><th>Hora</th><th>Estado</th><th>Sala</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="note">
          <p><strong>Indicaciones:</strong> Presentarse puntualmente con los materiales solicitados.</p>
          <p>Observaciones: ${escapeHtml(exam.notes || 'Sin observaciones registradas.')}</p>
        </div>
      </body>
    </html>`
}
