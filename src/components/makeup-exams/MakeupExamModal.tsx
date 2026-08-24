import React from 'react'
import { Check } from 'lucide-react'
import {
  useCreateMakeupExams,
  useTests,
  useUpdateMakeupExam,
} from '../../hooks/queries'
import type { Course, Student, Test } from '../../types'
import type {
  MakeupExamStatus,
  MakeupExamWithDetails,
} from '../../services/makeupExamService'
import {
  MAKEUP_EXAM_STATUS_LABELS,
  MAKEUP_EXAM_STATUS_OPTIONS,
} from '../../utils/makeupExam'
import { buildMakeupExamInputs } from '../../utils/makeupExamForm'
import { toDateOnlyString } from '../../utils'
import { useToast } from '../../contexts/ToastContext'
import { TOAST_TYPES } from '../../constants'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'

export type MakeupExamPrefill = {
  courseId?: string
  studentId: string
  testId?: string
  sourceAbsenceId?: string
}

interface MakeupExamModalProps {
  isOpen: boolean
  onClose: () => void
  level: 'BASICA' | 'MEDIA'
  courses: Course[]
  students: Student[]
  editingExam?: MakeupExamWithDetails | null
  initialValues?: MakeupExamPrefill
}

type FormState = {
  courseId: string
  studentId: string
  scheduledDate: string
  status: MakeupExamStatus
  testIds: string[]
}

const emptyForm = (initial?: MakeupExamPrefill): FormState => ({
  courseId: initial?.courseId ?? '',
  studentId: initial?.studentId ?? '',
  scheduledDate: toDateOnlyString(new Date()),
  status: 'pendiente',
  testIds: initial?.testId ? [initial.testId] : [],
})

export const MakeupExamModal: React.FC<MakeupExamModalProps> = ({
  isOpen,
  onClose,
  level,
  courses,
  students,
  editingExam = null,
  initialValues,
}) => {
  const [form, setForm] = React.useState<FormState>(() =>
    emptyForm(initialValues)
  )
  const { showToast } = useToast()
  const createMutation = useCreateMakeupExams()
  const updateMutation = useUpdateMakeupExam()
  const { data: tests = [], isLoading: testsLoading } = useTests(
    form.courseId || undefined,
    undefined,
    undefined,
    level
  )

  const availableTests = React.useMemo(
    () => tests.filter((test) => test.course_id === form.courseId),
    [form.courseId, tests]
  )
  const filteredStudents = React.useMemo(
    () => students.filter((student) => student.course_id === form.courseId),
    [form.courseId, students]
  )
  const selectedTestIds = React.useMemo(
    () => new Set(form.testIds),
    [form.testIds]
  )
  const selectedTests = React.useMemo(
    () => availableTests.filter((test) => selectedTestIds.has(test.id)),
    [availableTests, selectedTestIds]
  )

  React.useEffect(() => {
    if (!isOpen) return
    if (editingExam) {
      setForm({
        courseId: editingExam.students?.course_id ?? '',
        studentId: editingExam.student_id,
        scheduledDate: editingExam.scheduled_date,
        status: editingExam.status as MakeupExamStatus,
        testIds: editingExam.test_id ? [editingExam.test_id] : [],
      })
    } else {
      setForm(emptyForm(initialValues))
    }
  }, [editingExam, initialValues, isOpen])

  const handleCourseChange = (courseId: string) => {
    setForm((current) => ({
      ...current,
      courseId,
      studentId: '',
      testIds: [],
    }))
  }

  const toggleTest = (testId: string) => {
    setForm((current) => ({
      ...current,
      testIds: current.testIds.includes(testId)
        ? current.testIds.filter((id) => id !== testId)
        : [...current.testIds, testId],
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.courseId || !form.studentId || !form.scheduledDate) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Completa curso, estudiante y fecha de recuperación.',
      })
      return
    }
    if (selectedTests.length === 0) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Selecciona al menos una prueba.',
      })
      return
    }

    const inputs = buildMakeupExamInputs(availableTests, {
      studentId: form.studentId,
      scheduledDate: form.scheduledDate,
      status: form.status,
      testIds: form.testIds,
      sourceAbsenceId: initialValues?.sourceAbsenceId,
    })

    try {
      if (editingExam) {
        const test = selectedTests[0]
        if (!test) return
        await updateMutation.mutateAsync({
          id: editingExam.id,
          input: {
            scheduled_date: form.scheduledDate,
            status: form.status,
          },
        })
      } else {
        await createMutation.mutateAsync(inputs)
      }
      onClose()
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: editingExam
          ? 'Prueba atrasada actualizada.'
          : `${inputs.length} recuperación${inputs.length === 1 ? '' : 'es'} registrada${inputs.length === 1 ? '' : 's'}.`,
      })
    } catch (error) {
      showToast({
        type: TOAST_TYPES.ERROR,
        message:
          error instanceof Error
            ? error.message
            : 'No se pudieron guardar las recuperaciones.',
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
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Curso"
            data-testid="makeup-exam-course"
            value={form.courseId}
            onChange={(event) => handleCourseChange(event.target.value)}
            options={[
              { value: '', label: 'Seleccionar curso' },
              ...courses.map((course) => ({
                value: course.id,
                label: course.name,
              })),
            ]}
            disabled={Boolean(editingExam) || Boolean(initialValues?.courseId)}
          />
          <Select
            label="Estudiante"
            data-testid="makeup-exam-student"
            value={form.studentId}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                studentId: event.target.value,
              }))
            }
            options={[
              { value: '', label: 'Seleccionar estudiante' },
              ...filteredStudents.map((student) => ({
                value: student.id,
                label: student.full_name,
              })),
            ]}
            disabled={
              !form.courseId ||
              Boolean(editingExam) ||
              Boolean(initialValues?.studentId)
            }
          />
        </div>

        <fieldset className="space-y-2" data-testid="makeup-exam-tests">
          <legend className="text-sm font-semibold text-slate-700">
            Pruebas a recuperar
          </legend>
          {!form.courseId ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Selecciona un curso para ver sus pruebas.
            </p>
          ) : testsLoading ? (
            <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              Cargando pruebas del curso…
            </p>
          ) : availableTests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No hay pruebas registradas para este curso.
            </p>
          ) : (
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {availableTests.map((test: Test) => {
                const checked = selectedTestIds.has(test.id)
                return (
                  <label
                    key={test.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${checked ? 'border-indigo-200 bg-indigo-50' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTest(test.id)}
                      disabled={Boolean(editingExam)}
                      aria-label={`${test.subject} ${test.date}`}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-800">
                        {test.subject}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {test.type} · {test.date}
                      </span>
                    </span>
                    {checked && <Check className="h-4 w-4 text-indigo-600" />}
                  </label>
                )
              })}
            </div>
          )}
          <p className="text-xs text-slate-500">
            {form.testIds.length} prueba
            {form.testIds.length === 1 ? '' : 's'} seleccionada
            {form.testIds.length === 1 ? '' : 's'}.
          </p>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-semibold text-slate-700">
            Fecha de recuperación
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  scheduledDate: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-normal"
              required
            />
          </label>
          <Select
            label="Estado"
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as MakeupExamStatus,
              }))
            }
            options={MAKEUP_EXAM_STATUS_OPTIONS.map((value) => ({
              value,
              label: MAKEUP_EXAM_STATUS_LABELS[value],
            }))}
          />
        </div>

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
