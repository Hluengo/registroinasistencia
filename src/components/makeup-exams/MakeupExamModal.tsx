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
  editingExams?: MakeupExamWithDetails[]
  initialValues?: MakeupExamPrefill
}

type FormState = {
  courseId: string
  studentId: string
  scheduledDate: string
  status: MakeupExamStatus
  testIds: string[]
  testScheduledDates: Record<string, string>
  observation: string
  entryMode: 'catalog' | 'manual'
  manualEntries: Array<{
    id: string
    subject: string
    scheduledDate: string
    notes: string
  }>
  testNotes: Record<string, string>
}

const emptyManualEntry = () => ({
  id: crypto.randomUUID(),
  subject: '',
  scheduledDate: toDateOnlyString(new Date()),
  notes: '',
})

const emptyForm = (initial?: MakeupExamPrefill): FormState => ({
  courseId: initial?.courseId ?? '',
  studentId: initial?.studentId ?? '',
  scheduledDate: toDateOnlyString(new Date()),
  status: 'pendiente',
  testIds: initial?.testId ? [initial.testId] : [],
  testScheduledDates: initial?.testId
    ? { [initial.testId]: toDateOnlyString(new Date()) }
    : {},
  observation: '',
  entryMode: 'catalog',
  manualEntries: [emptyManualEntry()],
  testNotes: {},
})

export const MakeupExamModal: React.FC<MakeupExamModalProps> = ({
  isOpen,
  onClose,
  level,
  courses,
  students,
  editingExam = null,
  editingExams,
  initialValues,
}) => {
  const [form, setForm] = React.useState<FormState>(() =>
    emptyForm(initialValues)
  )
  const { showToast } = useToast()
  const examsBeingEdited = React.useMemo(
    () =>
      editingExams?.length ? editingExams : editingExam ? [editingExam] : [],
    [editingExam, editingExams]
  )
  const isEditing = examsBeingEdited.length > 0
  const isBulkEditing = examsBeingEdited.length > 1
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
    if (isEditing) {
      const firstExam = examsBeingEdited[0]
      if (!firstExam) return
      const allManual = examsBeingEdited.every((exam) => !exam.test_id)
      setForm({
        courseId: firstExam.students?.course_id ?? '',
        studentId: firstExam.student_id,
        scheduledDate: firstExam.scheduled_date,
        status: firstExam.status as MakeupExamStatus,
        testIds: examsBeingEdited.flatMap((exam) =>
          exam.test_id ? [exam.test_id] : []
        ),
        testScheduledDates: Object.fromEntries(
          examsBeingEdited.flatMap((exam) =>
            exam.test_id ? [[exam.test_id, exam.scheduled_date]] : []
          )
        ),
        observation: '',
        testNotes: Object.fromEntries(
          examsBeingEdited.flatMap((exam) =>
            exam.test_id ? [[exam.test_id, exam.notes ?? '']] : []
          )
        ),
        entryMode: allManual ? 'manual' : 'catalog',
        manualEntries: allManual
          ? examsBeingEdited.map((exam) => ({
              id: exam.id,
              subject: exam.subject,
              scheduledDate: exam.scheduled_date,
              notes: exam.notes ?? '',
            }))
          : [],
      })
    } else {
      setForm(emptyForm(initialValues))
    }
  }, [examsBeingEdited, initialValues, isEditing, isOpen])

  const handleCourseChange = (courseId: string) => {
    setForm((current) => ({
      ...current,
      courseId,
      studentId: '',
      testIds: [],
      testScheduledDates: {},
      testNotes: {},
    }))
  }

  const toggleTest = (testId: string) => {
    setForm((current) => {
      const isSelected = current.testIds.includes(testId)
      return {
        ...current,
        testIds: isEditing
          ? isSelected
            ? []
            : [testId]
          : isSelected
            ? current.testIds.filter((id) => id !== testId)
            : [...current.testIds, testId],
        testScheduledDates: isSelected
          ? Object.fromEntries(
              Object.entries(current.testScheduledDates).filter(
                ([id]) => id !== testId
              )
            )
          : {
              ...current.testScheduledDates,
              [testId]:
                current.testScheduledDates[testId] ||
                toDateOnlyString(new Date()),
            },
      }
    })
  }

  const handleEntryModeChange = (entryMode: FormState['entryMode']) => {
    setForm((current) => ({
      ...current,
      entryMode,
    }))
  }

  const updateTestNote = (testId: string, notes: string) => {
    setForm((current) => ({
      ...current,
      testNotes: { ...current.testNotes, [testId]: notes },
    }))
  }

  const updateTestScheduledDate = (testId: string, scheduledDate: string) => {
    setForm((current) => ({
      ...current,
      testScheduledDates: {
        ...current.testScheduledDates,
        [testId]: scheduledDate,
      },
    }))
  }

  const updateManualEntry = (
    index: number,
    field: 'subject' | 'scheduledDate' | 'notes',
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
      notes: entry.notes,
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
    if (
      selectedTests.some((test) => !form.testScheduledDates[test.id]) ||
      (editingExam?.test_id && selectedTests.length > 0 && !form.scheduledDate)
    ) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message:
          'Completa la fecha de recuperación de las pruebas registradas.',
      })
      return
    }
    if (!isEditing && selectedTests.length === 0 && !hasManualEntry) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Selecciona una prueba o completa los datos manuales.',
      })
      return
    }
    if (
      isEditing &&
      examsBeingEdited.some((exam) => !exam.test_id) &&
      !hasManualEntry
    ) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Completa asignatura y fecha de evaluación.',
      })
      return
    }
    if (editingExam?.test_id && selectedTests.length !== 1) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'Selecciona una prueba registrada para editar.',
      })
      return
    }

    const inputs = buildMakeupExamInputs(availableTests, {
      studentId: form.studentId,
      scheduledDate: form.scheduledDate,
      status: form.status,
      testIds: form.testIds,
      testScheduledDates: form.testScheduledDates,
      observation: form.observation,
      manualEntries,
      testNotes: form.testNotes,
      sourceAbsenceId: initialValues?.sourceAbsenceId,
    })

    try {
      if (isEditing && examsBeingEdited.every((exam) => !exam.test_id)) {
        await Promise.all(
          examsBeingEdited.map((exam, index) => {
            const entry = manualEntries[index]
            return updateMutation.mutateAsync({
              id: exam.id,
              input: {
                scheduled_date: entry?.scheduledDate ?? exam.scheduled_date,
                status: form.status,
                notes: entry?.notes.trim() || null,
                subject: entry?.subject ?? exam.subject,
                original_date: null,
              },
            })
          })
        )
      } else if (editingExam) {
        await updateMutation.mutateAsync({
          id: editingExam.id,
          input: {
            scheduled_date: editingExam.test_id
              ? (form.testScheduledDates[selectedTests[0]?.id ?? ''] ??
                form.scheduledDate)
              : (manualEntries[0]?.scheduledDate ?? form.scheduledDate),
            status: form.status,
            notes: editingExam.test_id
              ? selectedTests[0]
                ? form.testNotes[selectedTests[0].id]?.trim() || null
                : null
              : manualEntries[0]?.notes.trim() || null,
            ...(editingExam.test_id
              ? {
                  test_id: selectedTests[0]?.id ?? editingExam.test_id,
                  subject: selectedTests[0]?.subject ?? editingExam.subject,
                  original_date:
                    selectedTests[0]?.date ?? editingExam.original_date,
                }
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
        message: isEditing
          ? isBulkEditing
            ? `${examsBeingEdited.length} recuperaciones actualizadas.`
            : 'Prueba atrasada actualizada.'
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
        isEditing
          ? isBulkEditing
            ? 'Editar recuperaciones'
            : 'Editar prueba atrasada'
          : 'Registrar prueba atrasada'
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
            disabled={isEditing || Boolean(initialValues?.courseId)}
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
              !form.courseId || isEditing || Boolean(initialValues?.studentId)
            }
          />
        </div>

        {!isEditing && (
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

        {form.entryMode === 'catalog' && !isEditing && (
          <label className="block space-y-1 text-sm font-semibold text-slate-700">
            Observación
            <textarea
              aria-label="Observación general"
              value={form.observation}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  observation: event.target.value,
                }))
              }
              placeholder="Ej. Coordinar con UTP"
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
            />
          </label>
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
                {!isEditing && (
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
                  className="grid gap-4 rounded-lg border border-indigo-100 bg-white p-3 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end"
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
                    Fecha de recuperación
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
                  <label className="space-y-1 text-sm font-semibold text-slate-700">
                    Observación
                    <textarea
                      data-testid={
                        index === 0
                          ? 'makeup-exam-manual-notes'
                          : `makeup-exam-manual-notes-${index}`
                      }
                      value={entry.notes}
                      onChange={(event) =>
                        updateManualEntry(index, 'notes', event.target.value)
                      }
                      placeholder="Ej. Coordinar con UTP"
                      rows={1}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"
                    />
                  </label>
                  {!isEditing && form.manualEntries.length > 1 && (
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
                  className="grid gap-3 rounded-lg bg-white px-3 py-2 text-sm md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {test.subject}
                    </p>
                    <p className="text-xs text-slate-500">
                      {test.type} · {test.date}
                    </p>
                  </div>
                  <label className="space-y-1 text-xs font-semibold text-slate-600">
                    Fecha de recuperación
                    <input
                      type="date"
                      value={form.testScheduledDates[test.id] ?? ''}
                      onChange={(event) =>
                        updateTestScheduledDate(test.id, event.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 font-normal"
                      required
                    />
                  </label>
                  <label className="space-y-1 text-xs font-semibold text-slate-600">
                    Observación
                    <textarea
                      aria-label={`Observación de ${test.subject}`}
                      value={form.testNotes[test.id] ?? ''}
                      onChange={(event) =>
                        updateTestNote(test.id, event.target.value)
                      }
                      placeholder="Agregar observación"
                      rows={1}
                      className="w-full resize-none rounded-lg border border-slate-200 px-2 py-1.5 font-normal"
                    />
                  </label>
                  {!isEditing && (
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

        <div className="grid gap-4">
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
