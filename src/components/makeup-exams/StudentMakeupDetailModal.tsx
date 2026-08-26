import React from 'react'
import { Printer } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type {
  MakeupExamStatus,
  MakeupExamWithDetails,
} from '../../services/makeupExamService'
import {
  MAKEUP_EXAM_STATUS_LABELS,
  MAKEUP_EXAM_STATUS_OPTIONS,
  summarizeMakeupExams,
} from '../../utils/makeupExam'
import { buildMakeupCitationDocument } from '../../utils/makeupExamPrint'
import { useToast } from '../../contexts/ToastContext'
import { TOAST_TYPES } from '../../constants'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface StudentMakeupDetailModalProps {
  isOpen: boolean
  onClose: () => void
  exams: MakeupExamWithDetails[]
  isLoading: boolean
  student: MakeupExamWithDetails['students']
  onStatusChange: (
    exam: MakeupExamWithDetails,
    status: MakeupExamStatus
  ) => void | Promise<void>
}

export const StudentMakeupDetailModal: React.FC<
  StudentMakeupDetailModalProps
> = ({
  isOpen,
  onClose,
  exams,
  isLoading,
  student: selectedStudent,
  onStatusChange,
}) => {
  const { showToast } = useToast()
  const student = exams[0]?.students ?? selectedStudent
  const stats = summarizeMakeupExams(exams)

  const printCitation = () => {
    const exam = exams[0]
    if (!exam) return
    const popup = window.open('', '_blank', 'noopener,noreferrer')
    if (!popup) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Permite las ventanas emergentes para imprimir la citación.',
      })
      return
    }
    popup.document.write(buildMakeupCitationDocument(exam, exams))
    popup.document.close()
    popup.focus()
    popup.print()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha de recuperaciones"
      size="lg"
      testId="modal-makeup-student-detail"
    >
      {student ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
            <h2 className="text-lg font-bold text-slate-900">
              {student.full_name}
            </h2>
            <p className="text-sm text-slate-600">
              {student.courses?.name ?? 'Sin curso'} · RUT:{' '}
              {student.rut ?? 'N/A'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <p className="text-xl font-bold text-amber-700">
                {stats.pending}
              </p>
              <p className="text-xs text-slate-500">Pendientes</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-center">
              <p className="text-xl font-bold text-emerald-700">
                {stats.completed}
              </p>
              <p className="text-xs text-slate-500">Rendidas</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-3 text-center">
              <p className="text-xl font-bold text-rose-700">
                {stats.conflicts}
              </p>
              <p className="text-xs text-slate-500">Conflictos</p>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[23%]" />
                <col className="w-[27%]" />
                <col className="w-[25%]" />
                <col className="w-[25%]" />
              </colgroup>
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="break-words px-4 py-3">Asignatura</th>
                  <th className="break-words px-4 py-3">Fecha de evaluación</th>
                  <th className="break-words px-4 py-3">Observación</th>
                  <th className="break-words px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      Cargando pruebas del estudiante…
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-slate-500"
                    >
                      No hay pruebas atrasadas registradas.
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => (
                    <tr key={exam.id}>
                      <td className="break-words px-4 py-3 font-semibold text-slate-800">
                        {exam.subject}
                      </td>
                      <td className="break-words px-4 py-3 text-slate-600">
                        {format(parseISO(exam.scheduled_date), 'dd-MM-yyyy')}
                        {exam.scheduled_time ? ` · ${exam.scheduled_time}` : ''}
                      </td>
                      <td className="break-words px-4 py-3 text-slate-600">
                        {exam.notes ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          aria-label={`Estado de ${exam.subject}`}
                          value={exam.status}
                          onChange={(event) =>
                            onStatusChange(
                              exam,
                              event.target.value as MakeupExamStatus
                            )
                          }
                          className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                        >
                          {MAKEUP_EXAM_STATUS_OPTIONS.map((value) => (
                            <option key={value} value={value}>
                              {MAKEUP_EXAM_STATUS_LABELS[value]}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" icon={Printer} onClick={printCitation}>
              Imprimir citación
            </Button>
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Cargando ficha del estudiante…</p>
      )}
    </Modal>
  )
}
