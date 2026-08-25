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
  entryMode: 'catalog' | 'manual'
  manualEntries: Array<{
    id: string
    subject: string
    scheduledDate: string
  }>
}

const emptyManualEntry = () => ({
  id: crypto.randomUUID(),
  subject: '',
  scheduledDate: toDateOnlyString(new Date()),
})

const emptyForm = (initial?: MakeupExamPrefill): FormState => ({
  courseId: initial?.courseId ?? '',
  studentId: initial?.studentId ?? '',
  scheduledDate: toDateOnlyString(new Date()),
  status: 'pendiente',
  testIds: initial?.testId ? [initial.testId] : [],
  entryMode: 'catalog',
  manualEntries: [emptyManualEntry()],
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
        entryMode: editingExam.test_id ? 'catalog' : 'manual',
        manualEntries: editingExam.test_id
          ? []
          : [
              {
                id: editingExam.id,
                subject: editingExam.subject,
                scheduledDate: editingExam.scheduled_date,
              },
            ],
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

  const handleEntryModeChange = (entryMode: FormState['entryMode']) => {
    setForm((current) => ({
      ...current,
      entryMode,
    }))
  }

  const updateManualEntry = (
    index: number,
    field: 'subject' | 'scheduledDate',
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      manualEntries: current.manualEntries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      ),
    }))
  }

  const addManualEntry = () => {
    setForm((current) => ({
      ...current,
      manualEntries: [...current.manualEntries, emptyManualEntry()],
    }))
  }

  const removeManualEntry = (index: number) => {
    setForm((current) => ({
      ...current,
      manualEntries: current.manualEntries.filter(
        (_, entryIndex) => entryIndex !== index
      ),
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.courseId || !form.studentId) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Completa curso y estudiante.',
      })
      return
    }
    const manualEntries = form.manualEntries.map((entry) => ({
      subject: entry.subject.trim(),
      scheduledDate: entry.scheduledDate,
    }))
    const hasManualEntry = manualEntries.some(
      (entry) => entry.subject && entry.scheduledDate
    )
    const hasPartialManualEntry = manualEntries.some(
      (entry) =>
        Boolean(entry.subject || entry.scheduledDate) &&
        !(entry.subject && entry.scheduledDate)
    )
    if (hasPartialManualEntry) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Completa asignatura y fecha de evaluación.',
      })
      return
    }
    if (selectedTests.length > 0 && !form.scheduledDate) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message:
          'Completa la fecha de recuperación de las pruebas registradas.',
      })
      return
    }
    if (!editingExam && selectedTests.length === 0 && !hasManualEntry) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Selecciona una prueba o completa los datos manuales.',
      })
      return
    }
    if (editingExam && !editingExam.test_id && !hasManualEntry) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Completa asignatura y fecha de evaluación.',
      })
      return
    }

    const inputs = buildMakeupExamInputs(availableTests, {
      studentId: form.studentId,
      scheduledDate: form.scheduledDate,
      status: form.status,
      testIds: form.testIds,
      manualEntries,
      sourceAbsenceId: initialValues?.sourceAbsenceId,
    })

    try {
      if (editingExam) {
        await updateMutation.mutateAsync({
          id: editingExam.id,
          input: {
            scheduled_date: editingExam.test_id
              ? form.scheduledDate
              : (manualEntries[0]?.scheduledDate ?? form.scheduledDate),
            status: form.status,
            ...(editingExam.test_id
              ? {}
              : {
                  subject: manualEntries[0]?.subject ?? '',
                  original_date: null,
                }),
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

        {!editingExam && (
          <div className="flex gap-2 rounded-xl bg-slate-50 p-1">
            <Button
              type="button"
              size="sm"
              variant={form.entryMode === 'catalog' ? 'primary' : 'ghost'}
              onClick={() => handleEntryModeChange('catalog')}
            >
              Prueba registrada
            </Button>
            <Button
              type="button"
              size="sm"
              variant={form.entryMode === 'manual' ? 'primary' : 'ghost'}
              onClick={() => handleEntryModeChange('manual')}
            >
              Agregar manualmente
            </Button>
          </div>
        )}

        <fieldset className="space-y-2" data-testid="makeup-exam-tests">
          <legend className="text-sm font-semibold text-slate-700">
            Pruebas a recuperar
          </legend>
          {form.entryMode === 'manual' ? (
            <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">
                  Agrega una o más pruebas manuales
                </p>
                {!editingExam && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={addManualEntry}
                    data-testid="makeup-exam-manual-add"
                  >
                    + Agregar otra prueba
                  </Button>
                )}
              </div>
              {form.manualEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className="grid gap-4 rounded-lg border border-indigo-100 bg-white p-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
                >
                  <label className="space-y-1 text-sm font-semibold text-slate-700">
                    Asignatura
                    <input
                      data-testid={
                        index === 0
                          ? 'makeup-exam-manual-subject'
                          : `makeup-exam-manual-subject-${index}`
                      }
                      value={entry.subject}
                      onChange={(event) =>
                        updateManualEntry(index, 'subject', event.target.value)
                      }
                      placeholder="Ej. Matemática"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
                      required
                    />
                  </label>
                  <label className="space-y-1 text-sm font-semibold text-slate-700">
                    Fecha de evaluación
                    <input
                      data-testid={
                        index === 0
                          ? 'makeup-exam-manual-scheduled-date'
                          : `makeup-exam-manual-scheduled-date-${index}`
                      }
                      type="date"
                      value={entry.scheduledDate}
                      onChange={(event) =>
                        updateManualEntry(
                          index,
                          'scheduledDate',
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
                      required
                    />
                  </label>
                  {!editingExam && form.manualEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeManualEntry(index)}
                      className="rounded-lg px-2 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      aria-label={`Quitar prueba manual ${index + 1}`}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : !form.courseId ? (
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
          {form.entryMode === 'catalog' && (
            <p className="text-xs text-slate-500">
              {form.testIds.length} prueba
              {form.testIds.length === 1 ? '' : 's'} seleccionada
              {form.testIds.length === 1 ? '' : 's'}.
            </p>
          )}
          {selectedTests.length > 0 && (
            <div
              className="space-y-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
              data-testid="makeup-exam-selected-tests"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Pruebas registradas seleccionadas
              </p>
              {selectedTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
                >
                  <span>
                    <span className="block font-semibold text-slate-800">
                      {test.subject}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {test.type} · {test.date}
                    </span>
                  </span>
                  {!editingExam && (
                    <button
                      type="button"
                      onClick={() => toggleTest(test.id)}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      aria-label={`Quitar ${test.subject}`}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </fieldset>

        <div
          className={`grid gap-4 ${selectedTests.length > 0 ? 'md:grid-cols-2' : ''}`}
        >
          {selectedTests.length > 0 && (
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
          )}
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
