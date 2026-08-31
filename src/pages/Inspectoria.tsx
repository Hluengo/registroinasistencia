import React from 'react'
import {
  Plus,
  ShieldAlert,
  Search,
  Calendar,
  Clock,
  User,
  ChevronRight,
} from 'lucide-react'
import { useCreateInspectorateRecord } from '../hooks/queries'
import { useToast } from '../contexts/ToastContext'
import { Course, Student } from '../types'
import { useInspectorate, useCourses, useStudents } from '../hooks/queries'
import { createMutationGuard } from '../utils'
import { formatDateTime } from '../utils'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { TableSkeleton } from '../components/ui/Skeleton'
import { FormError } from '../components/ui/FormError'
import {
  useForm,
  type FieldErrors,
  type UseFormHandleSubmit,
  type UseFormRegister,
  type UseFormRegisterReturn,
  type UseFormSetValue,
} from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { inspectorateRecordValidationSchema } from '../lib/validators'
import {
  MONTHS,
  getYearOptions,
  getCourseOptions,
} from '../utils/filterOptions'
import { TOAST_TYPES } from '../constants'

interface InspectoriaProps {
  level: 'BASICA' | 'MEDIA'
}

type InspectorRowView = {
  id: string
  student_id: string | null
  created_at: string | null
  date_time: string
  observation: string
  student: Student & { course: Course }
}

type InspectorateFormData = {
  course_id?: string
  student_id: string
  date_time: string
  observation: string
}

type InspectoriaFiltersState = {
  courseId: string
  month: number
  year: number
  searchQuery: string
}

interface InspectoriaDetailModalProps {
  isOpen: boolean
  onClose: () => void
  selectedRecord: InspectorRowView | null
}

const InspectoriaDetailModal: React.FC<InspectoriaDetailModalProps> = ({
  isOpen,
  onClose,
  selectedRecord,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle de Atención"
      size="lg"
    >
      {selectedRecord && (
        <div className="space-y-6">
          <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-500 shadow-sm border border-slate-100">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {selectedRecord.student.full_name}
              </h3>
              <Badge variant="secondary" className="mt-1">
                {selectedRecord.student.course.name}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Fecha
              </div>
              <div className="text-sm font-bold text-slate-700">
                {formatDateTime(selectedRecord.date_time).split(' ')[0]}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Hora
              </div>
              <div className="text-sm font-bold text-slate-700">
                {new Date(selectedRecord.date_time).toLocaleTimeString(
                  'es-CL',
                  { hour: '2-digit', minute: '2-digit' }
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 ml-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" /> Observación
              Completa
            </p>
            <div className="p-5 bg-white border border-slate-200 rounded-2xl text-slate-700 text-sm leading-relaxed italic shadow-sm">
              &quot;{selectedRecord.observation}&quot;
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

type InspectorRow = InspectorRowView

const InspectorateTable: React.FC<{
  loading: boolean
  records: InspectorRow[]
  onViewDetail: (rec: InspectorRow) => void
}> = ({ loading, records, onViewDetail }) => (
  <div className="card overflow-hidden border border-slate-200/60 shadow-sm shadow-slate-200/20 rounded-3xl">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
            <th className="px-6 py-4">Estudiante</th>
            <th className="px-6 py-4">Fecha y Hora</th>
            <th className="px-6 py-4">Observación</th>
            <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={4} className="px-6 py-12">
                <TableSkeleton />
              </td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-12">
                <EmptyState
                  title="No se encontraron registros"
                  description="No hay atenciones registradas para el periodo o filtros seleccionados."
                />
              </td>
            </tr>
          ) : (
            records.map((rec) => (
              <tr
                key={rec.id}
                className="hover:bg-slate-50/80 transition-colors group"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200/60 shadow-sm group-hover:scale-110 transition-transform duration-200">
                      <User className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {rec.student.full_name}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400">
                        {rec.student.course.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <Clock className="w-4 h-4 opacity-60" strokeWidth={1.5} />
                    {formatDateTime(rec.date_time)}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm text-slate-500 line-clamp-1 max-w-md italic font-medium">
                    &quot;{rec.observation}&quot;
                  </p>
                </td>
                <td className="px-6 py-5 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetail(rec)}
                    icon={ChevronRight}
                    iconPosition="right"
                    className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                  >
                    Ver Detalle
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)

export const Inspectoria: React.FC<InspectoriaProps> = ({ level }) => {
  const [uiState, patchUiState] = React.useReducer(
    (
      state: {
        mutationLoading: boolean
        isModalOpen: boolean
        selectedRecord: InspectorRow | null
        isDetailModalOpen: boolean
        filters: {
          courseId: string
          month: number
          year: number
          searchQuery: string
        }
      },
      patch: Partial<{
        mutationLoading: boolean
        isModalOpen: boolean
        selectedRecord: InspectorRow | null
        isDetailModalOpen: boolean
        filters: {
          courseId: string
          month: number
          year: number
          searchQuery: string
        }
      }>
    ) => ({ ...state, ...patch }),
    {
      mutationLoading: false,
      isModalOpen: false,
      selectedRecord: null,
      isDetailModalOpen: false,
      filters: {
        courseId: '',
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        searchQuery: '',
      },
    }
  )
  const {
    mutationLoading,
    isModalOpen,
    selectedRecord,
    isDetailModalOpen,
    filters,
  } = uiState
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<InspectorateFormData>({
    resolver: zodResolver(inspectorateRecordValidationSchema),
    mode: 'onBlur',
    defaultValues: {
      course_id: '',
      student_id: '',
      date_time: '',
      observation: '',
    },
  })
  const watchCourse = watch('course_id') || ''
  const courseField = register('course_id')
  const studentField = register('student_id', {
    required: 'El estudiante es requerido',
  })
  const startISO = new Date(
    filters.year,
    filters.month,
    1,
    0,
    0,
    0,
    0
  ).toISOString()
  const endISO = new Date(
    filters.year,
    filters.month + 1,
    0,
    23,
    59,
    59,
    999
  ).toISOString()

  // Load all records for the selected level from Supabase and filter month/year client-side.
  // This avoids missing rows caused by strict timestamptz range filtering at query time.
  const { data: records = [], isLoading: recordsLoading } = useInspectorate(
    level,
    startISO,
    endISO
  )
  const { data: courses = [], isLoading: coursesLoading } = useCourses(level)
  const { data: students = [], isLoading: studentsLoading } = useStudents(
    watchCourse || undefined,
    level,
    isModalOpen && Boolean(watchCourse)
  )

  const loading = recordsLoading || coursesLoading || studentsLoading

  const courseOptions = getCourseOptions(courses)

  const filteredRecords = React.useMemo(
    () =>
      records.filter((rec: InspectorRow) => {
        const studentCourseId =
          rec.student?.course_id ??
          (rec.student as unknown as { course?: { id?: string } })?.course
            ?.id ??
          ''
        const matchesCourse =
          filters.courseId === '' || studentCourseId === filters.courseId
        const matchesSearch =
          (rec.student?.full_name ?? '')
            .toLowerCase()
            .includes(filters.searchQuery.toLowerCase()) ||
          (rec.observation ?? '')
            .toLowerCase()
            .includes(filters.searchQuery.toLowerCase())
        return matchesCourse && matchesSearch
      }),
    [records, filters.courseId, filters.searchQuery]
  )

  const createRecord = useCreateInspectorateRecord()

  const openCreateModal = React.useCallback(() => {
    reset({
      course_id: '',
      student_id: '',
      date_time: '',
      observation: '',
    })
    patchUiState({ isModalOpen: true })
  }, [reset])

  const closeCreateModal = React.useCallback(() => {
    reset({
      course_id: '',
      student_id: '',
      date_time: '',
      observation: '',
    })
    patchUiState({ isModalOpen: false })
  }, [reset])

  const onSubmit = async (data: InspectorateFormData) => {
    if (
      !createMutationGuard(mutationLoading, () =>
        showToast({
          type: TOAST_TYPES.WARNING,
          message: 'Ya se está procesando un registro',
        })
      )
    ) {
      return
    }
    try {
      patchUiState({ mutationLoading: true })
      await createRecord.mutateAsync({
        student_id: data.student_id,
        date_time: data.date_time,
        observation: data.observation,
      })
      closeCreateModal()
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: 'Registro de inspecteriía creado exitosamente',
      })
    } catch (error) {
      console.error('Error creating record:', error)
      const msg = error instanceof Error ? error.message : String(error)
      showToast({
        type: TOAST_TYPES.ERROR,
        message: `Error al crear el registro: ${msg}`,
      })
    } finally {
      patchUiState({ mutationLoading: false })
    }
  }

  const handleViewDetail = (rec: InspectorRow) => {
    patchUiState({ selectedRecord: rec, isDetailModalOpen: true })
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Bitácora de Inspectoría"
        description={`Registro de atenciones y situaciones de convivencia para Educación ${level === 'BASICA' ? 'Básica' : 'Media'}.`}
        breadcrumbs={[{ label: 'Inspectoría', active: true }]}
        action={
          <Button onClick={openCreateModal} icon={Plus} variant="primary">
            Nueva Atención
          </Button>
        }
        filters={
          <InspectoriaFilters
            courseOptions={courseOptions}
            filters={filters}
            setFilters={(filters) => patchUiState({ filters })}
          />
        }
      />

      <InspectorateTable
        loading={loading}
        records={filteredRecords}
        onViewDetail={handleViewDetail}
      />

      <CreateInspectorateModal
        closeCreateModal={closeCreateModal}
        courseField={courseField}
        courses={courses as Course[]}
        errors={errors}
        handleSubmit={handleSubmit}
        isModalOpen={isModalOpen}
        loading={loading || mutationLoading}
        onSubmit={onSubmit}
        register={register}
        setValue={setValue}
        studentField={studentField}
        students={students as Student[]}
        watchCourse={watchCourse}
      />

      <InspectoriaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => patchUiState({ isDetailModalOpen: false })}
        selectedRecord={selectedRecord}
      />
    </div>
  )
}

function InspectoriaFilters({
  courseOptions,
  filters,
  setFilters,
}: {
  courseOptions: Array<{ value: string; label: string }>
  filters: InspectoriaFiltersState
  setFilters: (filters: InspectoriaFiltersState) => void
}) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
      <div className="lg:col-span-5">
        <Input
          placeholder="Buscar por estudiante u observación..."
          icon={<Search className="w-4 h-4" />}
          value={filters.searchQuery}
          onChange={(e) =>
            setFilters({ ...filters, searchQuery: e.target.value })
          }
        />
      </div>
      <div className="lg:col-span-2">
        <Select
          options={MONTHS}
          value={filters.month}
          onChange={(e) =>
            setFilters({ ...filters, month: parseInt(e.target.value) })
          }
        />
      </div>
      <div className="lg:col-span-2">
        <Select
          options={getYearOptions()}
          value={filters.year}
          onChange={(e) =>
            setFilters({ ...filters, year: parseInt(e.target.value) })
          }
        />
      </div>
      <div className="lg:col-span-3">
        <Select
          options={courseOptions}
          value={filters.courseId}
          onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
        />
      </div>
      {(filters.courseId || filters.searchQuery) && (
        <div className="lg:col-span-12 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({ ...filters, courseId: '', searchQuery: '' })
            }
            className="font-bold text-slate-500 hover:text-indigo-600"
          >
            Limpiar Filtros
          </Button>
        </div>
      )}
    </div>
  )
}

function CreateInspectorateModal({
  closeCreateModal,
  courseField,
  courses,
  errors,
  handleSubmit,
  isModalOpen,
  loading,
  onSubmit,
  register,
  setValue,
  studentField,
  students,
  watchCourse,
}: {
  closeCreateModal: () => void
  courseField: UseFormRegisterReturn<'course_id'>
  courses: Course[]
  errors: FieldErrors<InspectorateFormData>
  handleSubmit: UseFormHandleSubmit<InspectorateFormData>
  isModalOpen: boolean
  loading: boolean
  onSubmit: (data: InspectorateFormData) => void | Promise<void>
  register: UseFormRegister<InspectorateFormData>
  setValue: UseFormSetValue<InspectorateFormData>
  studentField: UseFormRegisterReturn<'student_id'>
  students: Student[]
  watchCourse: string
}) {
  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeCreateModal}
      title="Registrar Atención de Inspectoría"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Select
              label="Curso"
              options={[
                { value: '', label: 'Seleccionar curso' },
                ...courses.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
              {...courseField}
              onChange={(e) => {
                courseField.onChange(e)
                setValue('student_id', '', { shouldValidate: true })
              }}
            />
          </div>
          <div>
            <Select
              label="Estudiante"
              options={[
                { value: '', label: 'Seleccionar estudiante' },
                ...students.map((s) => ({
                  value: s.id,
                  label: s.full_name,
                })),
              ]}
              {...studentField}
              disabled={!watchCourse}
            />
            <FormError error={errors.student_id} />
          </div>
        </div>

        <div>
          <Input
            label="Fecha y Hora"
            type="datetime-local"
            {...register('date_time', {
              required: 'La fecha y hora son requeridas',
            })}
          />
          <FormError error={errors.date_time} />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="inspectoria-observation"
            className="text-sm font-bold text-slate-700 ml-1"
          >
            Observación / Detalle
          </label>
          <textarea
            id="inspectoria-observation"
            {...register('observation', {
              required: 'La observación es requerida',
            })}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px] text-slate-700"
            placeholder="Describa la situación o motivo de la atención..."
          />
          <FormError error={errors.observation} />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={closeCreateModal}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Registrar Atención
          </Button>
        </div>
      </form>
    </Modal>
  )
}
