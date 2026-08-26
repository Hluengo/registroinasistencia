import type { MakeupExamWithDetails } from '../services/makeupExamService'
import { MAKEUP_EXAM_STATUS_LABELS } from './makeupExam'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const formatOfficialMakeupDate = (date: string) =>
  format(parseISO(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })

export const buildMakeupCitationDocument = (
  exam: MakeupExamWithDetails,
  studentExams: MakeupExamWithDetails[]
) => {
  const student = exam.students
  const sortedExams = studentExams
    .slice()
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date))
  const rows = sortedExams
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.subject)}</td>
          <td>${escapeHtml(formatOfficialMakeupDate(item.scheduled_date))}</td>
          <td>${escapeHtml(MAKEUP_EXAM_STATUS_LABELS[item.status as keyof typeof MAKEUP_EXAM_STATUS_LABELS] ?? item.status)}</td>
        </tr>`
    )
    .join('')
  const observations = Array.from(
    new Set(
      sortedExams
        .map((item) => item.notes?.trim())
        .filter((note): note is string => Boolean(note))
    )
  ).join(' · ')

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Citación de recuperación - ${escapeHtml(student?.full_name)}</title>
        <style>
          @page { size: 5.5in 8.5in; margin: 0; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #172033; margin: 0; }
          .page { width: 5.5in; min-height: 8.5in; padding: 0.36in; }
          .eyebrow { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: 1px; color: #38557b; }
          h1 { text-align: center; font-size: 17px; margin: 8px 0 4px; }
          .subtitle { text-align: center; font-size: 11px; margin: 0 0 14px; }
          .rule { border: 0; border-top: 2px solid #172033; }
          .student { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 5px; padding: 12px; margin-top: 14px; }
          .label { display: block; font-size: 9px; font-weight: 700; color: #52657f; text-transform: uppercase; }
          .value { display: block; font-size: 11px; font-weight: 700; margin-top: 3px; }
          .observation { border: 1px solid #f3c74f; border-radius: 5px; background: #fffbed; padding: 10px 12px; margin-top: 10px; font-size: 10px; }
          h2 { font-size: 11px; margin: 18px 0 7px; color: #38557b; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #b9c8dc; padding: 7px 6px; text-align: left; font-size: 9px; }
          th { background: #eef3f9; text-transform: uppercase; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 48px; text-align: center; font-size: 9px; font-weight: 700; }
          .signatures div { border-top: 1px solid #9aaaca; padding-top: 10px; }
        </style>
      </head>
      <body><main class="page">
        <div class="eyebrow">COORDINACIÓN DE CICLO</div>
        <h1>CALENDARIO AD HOC DE EVALUACIONES PENDIENTES</h1>
        <p class="subtitle">Control y Registro de Pruebas y Evaluaciones Pendientes</p>
        <hr class="rule" />
        <div class="student">
          <div><span class="label">Nombre del estudiante</span><span class="value">${escapeHtml(student?.full_name)}</span></div>
          <div><span class="label">Curso del estudiante</span><span class="value">${escapeHtml(student?.courses?.name || '-')}</span></div>
        </div>
        <div class="observation"><strong>OBSERVACIONES / MOTIVO AD HOC:</strong><br />${escapeHtml(observations || 'Sin observaciones registradas.')}</div>
        <h2>DETALLE DE EVALUACIONES:</h2>
        <table>
          <thead><tr><th>Asignatura</th><th>Fecha de rendición</th><th>Estado</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="signatures"><div>Firma Estudiante / Apoderado</div><div>Firma y Timbre Coordinación de Ciclo</div></div>
      </main></body>
    </html>`
}
