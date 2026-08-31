import React from 'react'
import { AlertCircle } from 'lucide-react'
import {
  useManageInstantMessages,
  useCreateInstantMessage,
  useUpdateInstantMessage,
  useStudents,
} from '../../hooks/queries'
import { useToast } from '../../contexts/ToastContext'
import { TOAST_TYPES } from '../../constants'
import { Tables } from '../../types/db'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'
import { StaffMessagesList } from './StaffMessagesList'
import {
  messageFormReducer,
  initialMessageFormState,
  MessageFormAction,
  MessageFormState,
} from './messageFormReducer'

type CourseRow = Tables<'courses'>
type InstantMessageRow = Tables<'instant_messages'>

interface StaffInstantMessagesManagerProps {
  level: 'BASICA' | 'MEDIA'
  courses: CourseRow[]
}

export const StaffInstantMessagesManager: React.FC<
  StaffInstantMessagesManagerProps
> = ({ level, courses }) => {
  const [formState, dispatch] = React.useReducer(
    messageFormReducer,
    initialMessageFormState
  )
  const { showToast } = useToast()

  const {
    data: manageableMessages = [],
    isLoading: manageableMessagesLoading,
    error: manageMessagesError,
  } = useManageInstantMessages(undefined, true)
  const createMessage = useCreateInstantMessage()
  const updateMessage = useUpdateInstantMessage()
  const { data: messageStudents = [], isLoading: messageStudentsLoading } =
    useStudents(
      formState.courseId || undefined,
      undefined,
      Boolean(formState.courseId)
    )

  const courseById = React.useMemo(
    () => new Map(courses.map((course) => [course.id, course])),
    [courses]
  )
  const messageCourseOptions = React.useMemo(() => {
    const filteredCourses =
      formState.scope === 'GENERAL'
        ? courses
        : courses.filter((course) => course.level === formState.scope)
    return [
      { value: '', label: 'Todos los cursos' },
      ...filteredCourses.map((course) => ({
        value: course.id,
        label: `${course.name} (${course.level})`,
      })),
    ]
  }, [courses, formState.scope])
  const messageStudentOptions = React.useMemo(
    () => [
      { value: '', label: 'Todos los estudiantes' },
      ...messageStudents.map((student) => ({
        value: student.id,
        label: student.full_name,
      })),
    ],
    [messageStudents]
  )
  const canSubmitMessage =
    formState.title.trim().length >= 3 && formState.body.trim().length >= 3
  const isEditingMessage = formState.editingMessageId !== null

  React.useEffect(() => {
    if (!formState.courseId && formState.studentId) {
      dispatch({ type: 'SET', payload: { studentId: '' } })
      return
    }
    if (
      formState.studentId &&
      !messageStudents.some((student) => student.id === formState.studentId)
    ) {
      dispatch({ type: 'SET', payload: { studentId: '' } })
    }
  }, [formState.courseId, formState.studentId, messageStudents])

  const resetMessageForm = () => dispatch({ type: 'RESET' })

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmitMessage) return

    const endsAtDate = formState.endsAt ? new Date(formState.endsAt) : null
    if (endsAtDate && Number.isNaN(endsAtDate.getTime())) {
      showToast({
        type: TOAST_TYPES.ERROR,
        message: 'La fecha de vigencia no es válida.',
      })
      return
    }
    if (endsAtDate && endsAtDate.getTime() < Date.now()) {
      showToast({
        type: TOAST_TYPES.WARNING,
        message: 'La fecha "Vigente hasta" debe ser futura.',
      })
      return
    }

    try {
      if (isEditingMessage && formState.editingMessageId) {
        await updateMessage.mutateAsync({
          id: formState.editingMessageId,
          updates: {
            title: formState.title.trim(),
            body: formState.body.trim(),
            level: formState.scope === 'GENERAL' ? null : formState.scope,
            course_id: formState.courseId || null,
            student_id: formState.studentId || null,
            ends_at: endsAtDate ? endsAtDate.toISOString() : null,
          },
        })
        showToast({
          type: TOAST_TYPES.SUCCESS,
          message: 'Mensaje instantáneo actualizado.',
        })
      } else {
        await createMessage.mutateAsync({
          title: formState.title.trim(),
          body: formState.body.trim(),
          level: formState.scope === 'GENERAL' ? null : formState.scope,
          course_id: formState.courseId || null,
          student_id: formState.studentId || null,
          ends_at: endsAtDate ? endsAtDate.toISOString() : null,
          is_active: true,
        })
        showToast({
          type: TOAST_TYPES.SUCCESS,
          message: 'Mensaje instantáneo publicado.',
        })
      }

      resetMessageForm()
      if (
        !isEditingMessage &&
        formState.scope !== 'GENERAL' &&
        formState.scope !== level
      ) {
        showToast({
          type: TOAST_TYPES.INFO,
          message: `El mensaje fue creado para ${formState.scope}. Cambia el nivel en el selector lateral para verlo en vista docente.`,
        })
      }
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'No se pudo publicar el mensaje.'
      showToast({ type: TOAST_TYPES.ERROR, message: msg })
    }
  }

  const toggleMessageActive = async (id: string, nextValue: boolean) => {
    try {
      await updateMessage.mutateAsync({ id, updates: { is_active: nextValue } })
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: nextValue ? 'Mensaje activado.' : 'Mensaje desactivado.',
      })
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el mensaje.'
      showToast({ type: TOAST_TYPES.ERROR, message: msg })
    }
  }

  const startEditMessage = (message: InstantMessageRow) => {
    dispatch({ type: 'START_EDIT', message })
  }

  return (
    <div className="space-y-5">
      <StaffMessageForm
        canSubmitMessage={canSubmitMessage}
        dispatch={dispatch}
        formState={formState}
        isEditingMessage={isEditingMessage}
        loading={createMessage.isPending || updateMessage.isPending}
        messageCourseOptions={messageCourseOptions}
        messageStudentOptions={messageStudentOptions}
        messageStudentsLoading={messageStudentsLoading}
        onReset={resetMessageForm}
        onSubmit={handleCreateMessage}
      />
      <StaffMessagesList
        messages={manageableMessages}
        isLoading={manageableMessagesLoading}
        hasError={Boolean(manageMessagesError)}
        courseById={courseById}
        onEdit={startEditMessage}
        onToggleActive={toggleMessageActive}
      />
    </div>
  )
}

function StaffMessageForm({
  canSubmitMessage,
  dispatch,
  formState,
  isEditingMessage,
  loading,
  messageCourseOptions,
  messageStudentOptions,
  messageStudentsLoading,
  onReset,
  onSubmit,
}: {
  canSubmitMessage: boolean
  dispatch: React.Dispatch<MessageFormAction>
  formState: MessageFormState
  isEditingMessage: boolean
  loading: boolean
  messageCourseOptions: Array<{ value: string; label: string }>
  messageStudentOptions: Array<{ value: string; label: string }>
  messageStudentsLoading: boolean
  onReset: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 lg:grid-cols-12 gap-3"
    >
      <div className="lg:col-span-6">
        <label
          htmlFor="instant-message-course"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
        >
          Curso
        </label>
        <Select
          id="instant-message-course"
          className="mt-1"
          value={formState.courseId}
          onChange={(e) =>
            dispatch({ type: 'SET', payload: { courseId: e.target.value } })
          }
          options={messageCourseOptions}
        />
      </div>
      <div className="lg:col-span-6">
        <label
          htmlFor="instant-message-student"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
        >
          Estudiante
        </label>
        <Select
          id="instant-message-student"
          className="mt-1"
          value={formState.studentId}
          onChange={(e) =>
            dispatch({ type: 'SET', payload: { studentId: e.target.value } })
          }
          options={messageStudentOptions}
          disabled={!formState.courseId || messageStudentsLoading}
        />
      </div>
      <div className="lg:col-span-6">
        <label
          htmlFor="instant-message-title"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
        >
          Título
        </label>
        <input
          id="instant-message-title"
          value={formState.title}
          onChange={(e) =>
            dispatch({ type: 'SET', payload: { title: e.target.value } })
          }
          className="input-base mt-1"
          placeholder="Ej: Cambio de horario por contingencia"
          maxLength={120}
        />
      </div>
      <div className="lg:col-span-3">
        <label
          htmlFor="instant-message-scope"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
        >
          Alcance
        </label>
        <Select
          id="instant-message-scope"
          className="mt-1"
          value={formState.scope}
          onChange={(e) =>
            dispatch({
              type: 'SET',
              payload: {
                scope: e.target.value as 'GENERAL' | 'BASICA' | 'MEDIA',
              },
            })
          }
          options={[
            { label: 'General', value: 'GENERAL' },
            { label: 'BÁSICA', value: 'BASICA' },
            { label: 'MEDIA', value: 'MEDIA' },
          ]}
        />
      </div>
      <div className="lg:col-span-3">
        <label
          htmlFor="instant-message-ends-at"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
        >
          Vigente hasta
        </label>
        <input
          id="instant-message-ends-at"
          type="datetime-local"
          value={formState.endsAt}
          onChange={(e) =>
            dispatch({ type: 'SET', payload: { endsAt: e.target.value } })
          }
          className="input-base mt-1"
        />
      </div>
      <div className="lg:col-span-12">
        <label
          htmlFor="instant-message-body"
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1"
        >
          Mensaje
        </label>
        <textarea
          id="instant-message-body"
          value={formState.body}
          onChange={(e) =>
            dispatch({ type: 'SET', payload: { body: e.target.value } })
          }
          rows={3}
          maxLength={1200}
          className="input-base mt-1 resize-y"
          placeholder="Describe la situación particular a informar."
        />
      </div>
      <div className="lg:col-span-12 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Se mostrará de inmediato en la vista docente.
        </p>
        <div className="flex items-center gap-2">
          {isEditingMessage ? (
            <Button type="button" variant="ghost" onClick={onReset}>
              Cancelar edición
            </Button>
          ) : null}
          <Button type="submit" loading={loading} disabled={!canSubmitMessage}>
            {isEditingMessage ? 'Guardar cambios' : 'Publicar mensaje'}
          </Button>
        </div>
      </div>
    </form>
  )
}
