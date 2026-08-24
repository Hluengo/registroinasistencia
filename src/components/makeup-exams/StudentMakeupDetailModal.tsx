import React from 'react'
import { Printer } from 'lucide-react'
import type { MakeupExamWithDetails } from '../../services/makeupExamService'
import {
  MAKEUP_EXAM_STATUS_LABELS,
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
}

export const StudentMakeupDetailModal: React.FC<
  StudentMakeupDetailModalProps
> = ({ isOpen, onClose, exams }) => {
  const { showToast } = useToast()
  const student = exams[0]?.students
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

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Asignatura</th>
                  <th className="px-4 py-3">Fecha original</th>
                  <th className="px-4 py-3">Recuperación</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Sala</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {exam.subject}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {exam.original_date ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {exam.scheduled_date}
                      {exam.scheduled_time ? ` · ${exam.scheduled_time}` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {MAKEUP_EXAM_STATUS_LABELS[
                        exam.status as keyof typeof MAKEUP_EXAM_STATUS_LABELS
                      ] ?? exam.status}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {exam.room ?? '-'}
                    </td>
                  </tr>
                ))}
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
