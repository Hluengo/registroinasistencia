import React from 'react'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Pencil,
  Plus,
  Search,
  Table2,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  useCourses,
  useMakeupExams,
  useStudents,
  useUpdateMakeupExam,
} from '../hooks/queries'
import type {
  MakeupExamWithDetails,
  MakeupExamStatus,
} from '../services/makeupExamService'
import {
  MAKEUP_EXAM_STATUS_LABELS,
  MAKEUP_EXAM_STATUS_OPTIONS,
  summarizeMakeupExams,
} from '../utils/makeupExam'
import { useToast } from '../contexts/ToastContext'
import { TOAST_TYPES } from '../constants'
import { Button } from '../components/ui/Button'
import { MakeupExamModal } from '../components/makeup-exams/MakeupExamModal'
import { StudentMakeupDetailModal } from '../components/makeup-exams/StudentMakeupDetailModal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { StatCard } from '../components/ui/StatCard'
import { TableSkeleton } from '../components/ui/Skeleton'

interface PruebasAtrasadasProps {
  level: 'BASICA' | 'MEDIA'
}

type ViewMode = 'calendar' | 'table'

const statusVariant = (status: MakeupExamStatus) => {
  if (status === 'rendida') return 'success'
  if (status === 'pendiente' || status === 'reprogramada') return 'warning'
  if (status === 'ausente') return 'danger'
  return 'info'
}

export const PruebasAtrasadas: React.FC<PruebasAtrasadasProps> = ({
  level,
}) => {
  const today = new Date()
  const [currentDate, setCurrentDate] = React.useState(today)
  const [viewMode, setViewMode] = React.useState<ViewMode>('calendar')
  const [courseId, setCourseId] = React.useState('')
  const [status, setStatus] = React.useState<'' | MakeupExamStatus>('')
  const [search, setSearch] = React.useState('')
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingExam, setEditingExam] =
    React.useState<MakeupExamWithDetails | null>(null)
  const [selectedStudentId, setSelectedStudentId] = React.useState<
    string | null
  >(null)
  const { showToast } = useToast()

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()
  const { data: exams = [], isLoading } = useMakeupExams({
    month,
    year,
    level,
    courseId: courseId || undefined,
    status: status || undefined,
  })
  const { data: courses = [] } = useCourses(level)
  const { data: students = [] } = useStudents(undefined, level)
  const updateMutation = useUpdateMakeupExam()
  const { data: studentExams = [], isLoading: isStudentExamsLoading } =
    useMakeupExams({
      level,
      studentId: selectedStudentId ?? undefined,
    })
  const selectedExam = React.useMemo(
    () => exams.find((exam) => exam.student_id === selectedStudentId),
    [exams, selectedStudentId]
  )

  const filteredExams = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return exams
    return exams.filter((exam) =>
      [exam.students?.full_name, exam.students?.courses?.name, exam.subject]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    )
  }, [exams, search])
  const stats = React.useMemo(
    () => summarizeMakeupExams(filteredExams),
    [filteredExams]
  )
  const groupedExams = React.useMemo(() => {
    const groups = new Map<string, MakeupExamWithDetails[]>()
    filteredExams.forEach((exam) => {
      const group = groups.get(exam.scheduled_date) ?? []
      group.push(exam)
      groups.set(exam.scheduled_date, group)
    })
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [filteredExams])
  const groupedStudents = React.useMemo(() => {
    const groups = new Map<string, MakeupExamWithDetails[]>()
    filteredExams.forEach((exam) => {
      const group = groups.get(exam.student_id) ?? []
      group.push(exam)
      groups.set(exam.student_id, group)
    })
    return Array.from(groups, ([studentId, studentExams]) => ({
      studentId,
      exams: studentExams,
    })).sort((a, b) =>
      (a.exams[0]?.students?.full_name ?? '').localeCompare(
        b.exams[0]?.students?.full_name ?? ''
      )
    )
  }, [filteredExams])

  const openCreate = () => {
    setEditingExam(null)
    setModalOpen(true)
  }

  const openEdit = (exam: MakeupExamWithDetails) => {
    setEditingExam(exam)
    setModalOpen(true)
  }

  const handleStatusChange = async (
    exam: MakeupExamWithDetails,
    nextStatus: MakeupExamStatus
  ) => {
    try {
      await updateMutation.mutateAsync({
        id: exam.id,
        input: { status: nextStatus },
      })
    } catch (error) {
      showToast({
        type: TOAST_TYPES.ERROR,
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar el estado.',
      })
    }
  }

  const moveMonth = (offset: number) =>
    setCurrentDate(new Date(year, month + offset, 1))

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pruebas atrasadas"
        description="Organiza recuperaciones, estados y fechas de estudiantes con evaluaciones pendientes."
        breadcrumbs={[
          { label: 'Evaluaciones', active: false },
          { label: 'Pruebas atrasadas', active: true },
        ]}
        action={
          <Button icon={Plus} onClick={openCreate} disabled={!students.length}>
            Nueva recuperación
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total del mes"
          value={stats.total}
          icon={ClipboardCheck}
          color="blue"
        />
        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={CalendarDays}
          color="amber"
        />
        <StatCard
          title="Rendidas"
          value={stats.completed}
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Conflictos"
          value={stats.conflicts}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative min-w-0 flex-1 basis-0 xl:min-w-[360px]">
            <span className="sr-only">Buscar estudiante o asignatura</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar estudiante, curso o asignatura"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </label>
          <Select
            aria-label="Filtrar pruebas atrasadas por curso"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            options={[
              { value: '', label: 'Todos los cursos' },
              ...courses.map((course) => ({
                value: course.id,
                label: course.name,
              })),
            ]}
            className="xl:w-64"
          />
          <Select
            aria-label="Filtrar pruebas atrasadas por estado"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as '' | MakeupExamStatus)
            }
            options={[
              { value: '', label: 'Todos los estados' },
              ...MAKEUP_EXAM_STATUS_OPTIONS.map((value) => ({
                value,
                label: MAKEUP_EXAM_STATUS_LABELS[value],
              })),
            ]}
            className="xl:w-56"
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => moveMonth(-1)}>
              Anterior
            </Button>
            <p className="min-w-40 text-center text-sm font-bold capitalize text-slate-800">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </p>
            <Button variant="secondary" size="sm" onClick={() => moveMonth(1)}>
              Siguiente
            </Button>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              aria-pressed={viewMode === 'calendar'}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <CalendarDays className="mr-1 inline h-4 w-4" /> Calendario
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
            >
              <Table2 className="mr-1 inline h-4 w-4" /> Tabla
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card p-8">
          <TableSkeleton />
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-500">
          No hay pruebas atrasadas para los filtros seleccionados.
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="space-y-4">
          {groupedExams.map(([date, dateExams]) => (
            <section key={date} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                <h2 className="font-bold capitalize text-slate-800">
                  {format(parseISO(date), "EEEE d 'de' MMMM", { locale: es })}
                </h2>
                <span className="text-xs font-semibold text-slate-500">
                  {dateExams.length}{' '}
                  {dateExams.length === 1 ? 'recuperación' : 'recuperaciones'}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {dateExams.map((exam) => (
                  <MakeupExamRow
                    key={exam.id}
                    exam={exam}
                    onEdit={openEdit}
                    onStatusChange={handleStatusChange}
                    onStudentClick={setSelectedStudentId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4">Estudiante</th>
                  <th className="px-5 py-4">Curso</th>
                  <th className="px-5 py-4">Pruebas a recuperar</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedStudents.map((group) => {
                  const student = group.exams[0]?.students
                  return (
                    <tr key={group.studentId} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 align-top font-semibold text-slate-800">
                        {student?.full_name ?? 'Estudiante sin nombre'}
                      </td>
                      <td className="px-5 py-4 align-top text-slate-600">
                        {student?.courses?.name ?? '-'}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-2">
                          {group.exams.map((exam) => (
                            <div
                              key={exam.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2"
                            >
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {exam.subject}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Evaluación:{' '}
                                  {format(
                                    parseISO(exam.scheduled_date),
                                    'dd-MM-yyyy'
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <select
                                  aria-label={`Estado de ${exam.subject} para ${student?.full_name ?? 'estudiante'}`}
                                  value={exam.status}
                                  onChange={(event) =>
                                    handleStatusChange(
                                      exam,
                                      event.target.value as MakeupExamStatus
                                    )
                                  }
                                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                                >
                                  {MAKEUP_EXAM_STATUS_OPTIONS.map((value) => (
                                    <option key={value} value={value}>
                                      {MAKEUP_EXAM_STATUS_LABELS[value]}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  icon={Pencil}
                                  aria-label={`Editar ${exam.subject}`}
                                  title={`Editar ${exam.subject}`}
                                  onClick={() => openEdit(exam)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudentId(group.studentId)}
                        >
                          Ver pruebas
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MakeupExamModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        level={level}
        courses={courses}
        students={students}
        editingExam={editingExam}
      />

      <StudentMakeupDetailModal
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
        exams={studentExams}
        isLoading={isStudentExamsLoading}
        student={selectedExam?.students ?? null}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}

function MakeupExamRow({
  exam,
  onEdit,
  onStatusChange,
  onStudentClick,
}: {
  exam: MakeupExamWithDetails
  onEdit: (exam: MakeupExamWithDetails) => void
  onStatusChange: (
    exam: MakeupExamWithDetails,
    status: MakeupExamStatus
  ) => void
  onStudentClick: (studentId: string) => void
}) {
  const status = exam.status as MakeupExamStatus
  return (
    <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="font-bold text-indigo-700 hover:underline"
            onClick={() => onStudentClick(exam.student_id)}
          >
            {exam.students?.full_name}
          </button>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            {exam.students?.courses?.name ?? 'Sin curso'}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {exam.subject}
          {exam.scheduled_time ? ` · ${exam.scheduled_time}` : ''}
          {exam.room ? ` · ${exam.room}` : ''}
        </p>
        {exam.original_date && (
          <p className="mt-1 text-xs text-slate-400">
            Prueba original: {exam.original_date}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusVariant(status) === 'success' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : statusVariant(status) === 'warning' ? 'border-amber-100 bg-amber-50 text-amber-700' : statusVariant(status) === 'danger' ? 'border-rose-100 bg-rose-50 text-rose-700' : 'border-indigo-100 bg-indigo-50 text-indigo-700'}`}
        >
          {MAKEUP_EXAM_STATUS_LABELS[status] ?? exam.status}
        </span>
        <select
          aria-label={`Cambiar estado de ${exam.subject}`}
          value={exam.status}
          onChange={(event) =>
            onStatusChange(exam, event.target.value as MakeupExamStatus)
          }
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
        >
          {MAKEUP_EXAM_STATUS_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {MAKEUP_EXAM_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          icon={Pencil}
          onClick={() => onEdit(exam)}
        >
          Editar
        </Button>
      </div>
    </div>
  )
}
