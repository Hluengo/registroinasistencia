import React from 'react'
import { Printer } from 'lucide-react'
import type {
  MakeupExamStatus,
  MakeupExamWithDetails,
} from '../../services/makeupExamService'
import { MAKEUP_EXAM_STATUS_LABELS } from '../../utils/makeupExam'
import {
  buildMakeupCitationDocument,
  formatOfficialMakeupDate,
} from '../../utils/makeupExamPrint'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface MakeupExamPrintModalProps {
  isOpen: boolean
  onClose: () => void
  exams: MakeupExamWithDetails[]
  initialStudentId?: string
}

export const MakeupExamPrintModal: React.FC<MakeupExamPrintModalProps> = ({
  isOpen,
  onClose,
  exams,
  initialStudentId,
}) => {
  const groups = React.useMemo(() => {
    const grouped = new Map<string, MakeupExamWithDetails[]>()
    exams.forEach((exam) => {
      grouped.set(exam.student_id, [
        ...(grouped.get(exam.student_id) ?? []),
        exam,
      ])
    })
    return Array.from(grouped.entries())
  }, [exams])
  const [selectedStudentId, setSelectedStudentId] = React.useState(
    initialStudentId ?? groups[0]?.[0] ?? ''
  )

  React.useEffect(() => {
    if (isOpen) {
      setSelectedStudentId(initialStudentId ?? groups[0]?.[0] ?? '')
    }
  }, [groups, initialStudentId, isOpen])

  const selectedExams = exams.filter(
    (exam) => exam.student_id === selectedStudentId
  )
  const firstExam = selectedExams[0]
  const student = firstExam?.students

  const printDocument = () => {
    if (!firstExam || selectedExams.length === 0) return
    const popup = window.open('', '_blank')
    if (!popup) return
    popup.document.write(buildMakeupCitationDocument(firstExam, selectedExams))
    popup.document.close()
    let printed = false
    const printPopup = () => {
      if (printed || popup.closed) return
      printed = true
      popup.focus()
      popup.print()
    }
    popup.onload = printPopup
    window.setTimeout(() => {
      printPopup()
    }, 250)
  }

  const observations = Array.from(
    new Set(
      selectedExams
        .map((exam) => exam.notes?.trim())
        .filter((note): note is string => Boolean(note))
    )
  ).join(' · ')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generador de documentos oficiales e impresión"
      size="xl"
      testId="modal-makeup-print"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <label className="flex min-w-0 items-center gap-3 text-sm font-bold uppercase tracking-wide text-slate-700">
            <span className="whitespace-nowrap">Estudiante a imprimir:</span>
            <select
              value={selectedStudentId}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              className="min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 normal-case tracking-normal"
            >
              {groups.map(([studentId, studentExams]) => (
                <option key={studentId} value={studentId}>
                  {studentExams[0]?.students?.courses?.name ?? 'Sin curso'} -{' '}
                  {studentExams[0]?.students?.full_name ?? 'Estudiante'}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-500">
              {selectedExams.length} evaluaciones registradas
            </span>
            <Button icon={Printer} onClick={printDocument}>
              Imprimir documento
            </Button>
          </div>
        </div>

        {firstExam && student ? (
          <div className="mx-auto min-h-[21.59cm] w-full max-w-[13.97cm] rounded-xl border border-slate-300 bg-white p-7 shadow-sm">
            <p className="text-center text-xs font-bold tracking-widest text-slate-600">
              COORDINACIÓN DE CICLO
            </p>
            <h1 className="mt-2 text-center text-lg font-black leading-tight text-slate-950">
              CALENDARIO AD HOC DE EVALUACIONES PENDIENTES
            </h1>
            <p className="mt-1 text-center text-xs text-slate-700">
              Control y Registro de Pruebas y Evaluaciones Pendientes
            </p>
            <hr className="my-4 border-t-2 border-slate-900" />
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-slate-300 bg-slate-50 p-3">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-500">
                  Nombre del estudiante
                </span>
                <span className="mt-1 block text-sm font-black text-slate-950">
                  {student.full_name}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-500">
                  Curso del estudiante
                </span>
                <span className="mt-1 block text-sm font-black text-slate-950">
                  {student.courses?.name ?? '-'}
                </span>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-slate-900">
              <strong>OBSERVACIONES / MOTIVO AD HOC:</strong>
              <br />
              {observations || 'Sin observaciones registradas.'}
            </div>
            <h2 className="mt-6 text-xs font-black tracking-wide text-slate-700">
              DETALLE DE EVALUACIONES:
            </h2>
            <table className="mt-2 w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="bg-slate-100 uppercase text-slate-700">
                  <th className="border border-slate-300 px-2 py-2">
                    Asignatura
                  </th>
                  <th className="border border-slate-300 px-2 py-2">
                    Fecha de rendición
                  </th>
                  <th className="border border-slate-300 px-2 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {selectedExams
                  .slice()
                  .sort((a, b) =>
                    a.scheduled_date.localeCompare(b.scheduled_date)
                  )
                  .map((exam) => {
                    const status = exam.status as MakeupExamStatus
                    return (
                      <tr key={exam.id}>
                        <td className="border border-slate-300 px-2 py-2 font-bold">
                          {exam.subject}
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
                          {formatOfficialMakeupDate(exam.scheduled_date)}
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center">
                          {MAKEUP_EXAM_STATUS_LABELS[status] ?? exam.status}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
            <div className="mt-16 grid grid-cols-2 gap-8 text-center text-xs font-bold">
              <div className="border-t border-slate-400 pt-3">
                Firma Estudiante / Apoderado
              </div>
              <div className="border-t border-slate-400 pt-3">
                Firma y Timbre Coordinación de Ciclo
              </div>
            </div>
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">
            No hay evaluaciones para imprimir.
          </p>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            Formato oficial: 13,97 × 21,59 cm (media carta).
          </p>
          <div className="flex gap-3">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
