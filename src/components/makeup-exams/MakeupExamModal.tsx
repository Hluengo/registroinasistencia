import React from 'react'
import { useCreateMakeupExam, useUpdateMakeupExam } from '../../hooks/queries'
import type { Student } from '../../types'
import type {
  MakeupExamStatus,
  MakeupExamWithDetails,
} from '../../services/makeupExamService'
import {
  MAKEUP_EXAM_STATUS_LABELS,
  MAKEUP_EXAM_STATUS_OPTIONS,
} from '../../utils/makeupExam'
import { toDateOnlyString } from '../../utils'
import { useToast } from '../../contexts/ToastContext'
import { TOAST_TYPES } from '../../constants'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'

export type MakeupExamPrefill = {
  studentId: string
  testId?: string
  sourceAbsenceId?: string
  originalDate?: string
  subject?: string
}

interface MakeupExamModalProps {
  isOpen: boolean
  onClose: () => void
  students: Student[]
  editingExam?: MakeupExamWithDetails | null
  initialValues?: MakeupExamPrefill
}

type FormState = {
  studentId: string
  originalDate: string
  scheduledDate: string
  subject: string
  status: MakeupExamStatus
  scheduledTime: string
  room: string
  proctor: string
  grade: string
  notes: string
}

const emptyForm = (initial?: MakeupExamPrefill): FormState => ({
  studentId: initial?.studentId ?? '',
  originalDate: initial?.originalDate ?? '',
  scheduledDate: toDateOnlyString(new Date()),
  subject: initial?.subject ?? '',
  status: 'pendiente',
  scheduledTime: '',
  room: '',
  proctor: '',
  grade: '',
  notes: '',
})

export const MakeupExamModal: React.FC<MakeupExamModalProps> = ({
  isOpen,
  onClose,
  students,
  editingExam = null,
  initialValues,
}) => {
  const [form, setForm] = React.useState<FormState>(emptyForm(initialValues))
  const { showToast } = useToast()
  const createMutation = useCreateMakeupExam()
  const updateMutation = useUpdateMakeupExam()

  React.useEffect(() => {
    if (!isOpen) return
    if (editingExam) {
      setForm({
        studentId: editingExam.student_id,
        originalDate: editingExam.original_date ?? '',
        scheduledDate: editingExam.scheduled_date,
        subject: editingExam.subject,
        status: editingExam.status as MakeupExamStatus,
        scheduledTime: editingExam.scheduled_time ?? '',
        room: editingExam.room ?? '',
        proctor: editingExam.proctor ?? '',
        grade: editingExam.grade === null ? '' : String(editingExam.grade),
        notes: editingExam.notes ?? '',
      })
    } else {
      setForm(emptyForm(initialValues))
    }
  }, [editingExam, initialValues, isOpen])

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.studentId || !form.subject.trim() || !form.scheduledDate) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Completa estudiante, asignatura y fecha.',
      })
      return
    }

    const grade = form.grade ? Number(form.grade) : null
    if (grade !== null && (Number.isNaN(grade) || grade < 1 || grade > 7)) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'La nota debe estar entre 1,0 y 7,0.',
      })
      return
    }

    const input = {
      student_id: form.studentId,
      original_date: form.originalDate || null,
      scheduled_date: form.scheduledDate,
      subject: form.subject.trim(),
      status: form.status,
      scheduled_time: form.scheduledTime || null,
      room: form.room.trim() || null,
      proctor: form.proctor.trim() || null,
      grade,
      notes: form.notes.trim() || null,
    }

    try {
      if (editingExam) {
        await updateMutation.mutateAsync({ id: editingExam.id, input })
      } else {
        await createMutation.mutateAsync({
          ...input,
          test_id: initialValues?.testId ?? null,
          source_absence_id: initialValues?.sourceAbsenceId ?? null,
        })
      }
      onClose()
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: editingExam
          ? 'Prueba atrasada actualizada.'
          : 'Prueba atrasada registrada.',
      })
    } catch (error) {
      showToast({
        type: TOAST_TYPES.ERROR,
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar la prueba atrasada.',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingExam ? 'Editar prueba atrasada' : 'Registrar prueba atrasada'
      }
      size="lg"
      testId="modal-makeup-exam"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Estudiante"
            value={form.studentId}
            onChange={(event) => updateForm('studentId', event.target.value)}
            options={students.map((student) => ({
              value: student.id,
              label: student.full_name,
            }))}
            disabled={Boolean(editingExam) || Boolean(initialValues)}
          />
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Asignatura
            <input
              value={form.subject}
              onChange={(event) => updateForm('subject', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              required
            />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Fecha original
            <input
              type="date"
              value={form.originalDate}
              onChange={(event) =>
                updateForm('originalDate', event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Fecha de recuperación
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(event) =>
                updateForm('scheduledDate', event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              required
            />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Hora
            <input
              type="time"
              value={form.scheduledTime}
              onChange={(event) =>
                updateForm('scheduledTime', event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
            />
          </label>
          <Select
            label="Estado"
            value={form.status}
            onChange={(event) =>
              updateForm('status', event.target.value as MakeupExamStatus)
            }
            options={MAKEUP_EXAM_STATUS_OPTIONS.map((value) => ({
              value,
              label: MAKEUP_EXAM_STATUS_LABELS[value],
            }))}
          />
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Sala
            <input
              value={form.room}
              onChange={(event) => updateForm('room', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Profesor/a
            <input
              value={form.proctor}
              onChange={(event) => updateForm('proctor', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
            />
          </label>
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Nota
            <input
              type="number"
              min="1"
              max="7"
              step="0.1"
              value={form.grade}
              onChange={(event) => updateForm('grade', event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
            />
          </label>
        </div>
        <label className="space-y-1 text-sm font-semibold text-slate-700">
          Observaciones
          <textarea
            value={form.notes}
            onChange={(event) => updateForm('notes', event.target.value)}
            className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
          />
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={createMutation.isPending || updateMutation.isPending}
          >
            Guardar recuperación
          </Button>
        </div>
      </form>
    </Modal>
  )
}
