import React from 'react'
import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Megaphone,
} from 'lucide-react'
import {
  useTeacherPublicAbsences,
  type TeacherPublicAbsence,
  useTeacherPublicAbsenceDetail,
  useTeacherInstantMessages,
} from '../hooks/queries'
import { useCourses } from '../hooks/queries'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { TableSkeleton } from '../components/ui/Skeleton'
import { formatDate } from '../utils'
import {
  MONTHS,
  getYearOptions,
  getCourseOptions,
} from '../utils/filterOptions'
import { getAbsenceStatusLabel } from '../constants'
import { StaffInstantMessagesManager } from '../components/staff-messages'

interface DocentePublicoProps {
  level: 'BASICA' | 'MEDIA'
  isStaff: boolean
}

export const DocentePublico: React.FC<DocentePublicoProps> = ({
  level,
  isStaff,
}) => {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedCourseId, setSelectedCourseId] = React.useState('')
  const [isStaffManagerOpen, setIsStaffManagerOpen] = React.useState(false)
  const [isMessagesCollapsed, setIsMessagesCollapsed] = React.useState(false)
  const [selected, setSelected] = React.useState<TeacherPublicAbsence | null>(
    null
  )
  const [isOpen, setIsOpen] = React.useState(false)

  const month = currentDate.getMonth()
  const year = currentDate.getFullYear()
  const {
    data = [],
    isLoading,
    isFetching,
  } = useTeacherPublicAbsences(
    month,
    year,
    level,
    selectedCourseId || undefined
  )
  const { data: selectedTests = [], isLoading: selectedTestsLoading } =
    useTeacherPublicAbsenceDetail(selected?.absence_id)
  const {
    data: courses = [],
    isLoading: coursesLoading,
  } = useCourses(level, true)
  const activeMessagesLevel = level
  const {
    data: instantMessages = [],
    isLoading: instantMessagesLoading,
  } = useTeacherInstantMessages(
    activeMessagesLevel,
    selectedCourseId || undefined
  )
  const { data: allActiveMessages = [] } = useTeacherInstantMessages(
    undefined,
    undefined,
    !isStaff
  )

  React.useEffect(() => {
    setSelectedCourseId('')
  }, [level])

  const loading = isLoading || coursesLoading
  const showInitialSkeleton = loading && data.length === 0
  const courseOptions = React.useMemo(
    () => getCourseOptions(courses),
    [courses]
  )
  const sortedData = React.useMemo(
    () =>
      [...data].sort((left, right) => {
        const leftDate = new Date(left.start_date).getTime()
        const rightDate = new Date(right.start_date).getTime()
        return rightDate - leftDate
      }),
    [data]
  )

  return (
    <div className="space-y-10">
      <PageHeader
        title="Vista Docente"
        description={`Lectura pública de inasistencias y pruebas afectadas (${level === 'BASICA' ? 'Básica' : 'Media'}).`}
        breadcrumbs={[{ label: 'Vista Docente', active: true }]}
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        }
        filters={
          <>
            <Select
              options={MONTHS}
              value={month}
              onChange={(e) =>
                setCurrentDate(new Date(year, Number(e.target.value), 1))
              }
              className="md:w-44"
            />
            <Select
              options={getYearOptions()}
              value={year}
              onChange={(e) =>
                setCurrentDate(new Date(Number(e.target.value), month, 1))
              }
              className="md:w-36"
            />
            <Select
              options={courseOptions}
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="md:w-64"
            />
          </>
        }
      />
      {isFetching && data.length > 0 ? (
        <p className="text-xs font-medium text-slate-400 -mt-6">
          Actualizando resultados...
        </p>
      ) : null}
      <div className="card border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">
              Comunicados
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Mensajes instantáneos
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {isStaff
                ? 'Vista previa staff: muestra todos los comunicados activos.'
                : 'Avisos importantes para el nivel y curso seleccionado.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsMessagesCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
            aria-label={
              isMessagesCollapsed ? 'Expandir mensajes' : 'Colapsar mensajes'
            }
          >
            <Bell className="w-4 h-4" />
            <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold px-1.5">
              {instantMessages.length}
            </span>
            <ChevronRight
              className={`w-4 h-4 transition-transform ${isMessagesCollapsed ? '' : 'rotate-90'}`}
            />
          </button>
        </div>
        {!isMessagesCollapsed ? (
          <div className="mt-4 space-y-3">
            {instantMessagesLoading ? (
              <p className="text-sm text-slate-400">Cargando mensajes...</p>
            ) : instantMessages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Sin comunicados activos en este momento.
                {!isStaff && allActiveMessages.length > 0 ? (
                  <span className="block mt-1 text-xs text-slate-400">
                    Hay comunicados activos en otro nivel. Cambia BÁSICA/MEDIA
                    desde el selector lateral.
                  </span>
                ) : null}
              </div>
            ) : (
              instantMessages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-2xl bg-white border border-slate-200 p-4 md:p-5 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500">
                    <Megaphone className="w-3.5 h-3.5" />
                    Aviso activo
                  </div>
                  <h4 className="text-slate-900 font-bold mt-1">
                    {message.title}
                  </h4>
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">
                    {message.body}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-3">
                    {message.level ? `Nivel ${message.level} • ` : ''}
                    Publicado: {formatDate(message.created_at)}
                    {message.ends_at
                      ? ` • Vigente hasta ${formatDate(message.ends_at)}`
                      : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            {instantMessages.length > 0
              ? `Tienes ${instantMessages.length} comunicado${instantMessages.length === 1 ? '' : 's'} activo${instantMessages.length === 1 ? '' : 's'}. Abre la vista para revisarlos.`
              : 'Sin comunicados activos por ahora. Puedes abrir la vista para confirmarlo.'}
          </p>
        )}
      </div>

      {isStaff ? (
        <div className="card border border-amber-200/70 bg-amber-50/40 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.2em]">
                Gestión Staff
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Gestor de mensajes instantáneos
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Crea avisos generales, por nivel o por curso para la vista
                docente.
              </p>
            </div>
            <Button
              type="button"
              variant={isStaffManagerOpen ? 'secondary' : 'primary'}
              onClick={() => setIsStaffManagerOpen((prev) => !prev)}
            >
              {isStaffManagerOpen ? 'Cerrar gestor' : 'Abrir gestor'}
            </Button>
          </div>
          {isStaffManagerOpen ? (
            <StaffInstantMessagesManager level={level} courses={courses} />
          ) : (
            <p className="text-sm text-slate-500">
              El gestor está oculto para reducir el largo de la página.
            </p>
          )}
        </div>
      ) : null}

      <div>
        <div className="mb-3 px-1">
          <h3 className="text-lg font-bold text-slate-900">
            Inasistencias, Justificaciones y Evaluaciones
          </h3>
          <p className="text-sm text-slate-500">
            Resumen de ausencias con su estado y pruebas afectadas.
          </p>
        </div>
        <div className="card overflow-hidden border border-slate-200/60 shadow-sm shadow-slate-200/20 rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                  <th className="px-6 py-4">Estudiante</th>
                  <th className="px-6 py-4">Curso</th>
                  <th className="px-6 py-4">Fechas</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Pruebas Afectadas</th>
                  <th className="px-6 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {showInitialSkeleton ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <TableSkeleton />
                    </td>
                  </tr>
                ) : sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12">
                      <EmptyState
                        title="Sin resultados"
                        description="No hay inasistencias públicas para el período seleccionado."
                      />
                    </td>
                  </tr>
                ) : (
                  sortedData.map((row) => (
                    <tr
                      key={row.absence_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-5 font-bold text-slate-900">
                        {row.student_name}
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                        {row.course_name}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {formatDate(row.start_date)} -{' '}
                          {formatDate(row.end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge
                          variant={
                            row.status === 'JUSTIFICADA' ? 'success' : 'warning'
                          }
                        >
                          {getAbsenceStatusLabel(row.status || 'PENDIENTE')}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-rose-600">
                        {row.affected_tests_count}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => {
                            setSelected(row)
                            setIsOpen(true)
                          }}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Detalle de Inasistencia"
        size="lg"
      >
        {!selected ? null : (
          <div className="space-y-5">
            <div className="text-sm text-slate-500">
              <p>
                <span className="font-bold text-slate-700">Estudiante:</span>{' '}
                {selected.student_name}
              </p>
              <p>
                <span className="font-bold text-slate-700">Curso:</span>{' '}
                {selected.course_name}
              </p>
              <p>
                <span className="font-bold text-slate-700">Fechas:</span>{' '}
                {formatDate(selected.start_date)} -{' '}
                {formatDate(selected.end_date)}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Observación
              </p>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm">
                {selected.observation || 'Sin observación registrada.'}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                Pruebas Afectadas ({selected.affected_tests_count})
              </p>
              {selectedTestsLoading ? (
                <p className="text-sm text-slate-400">Cargando detalle...</p>
              ) : selectedTests.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTests.map((test) => (
                    <div
                      key={test.id}
                      className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-sm"
                    >
                      <div className="font-bold text-slate-800">
                        {test.subject}
                      </div>
                      <div className="text-rose-600 font-medium">
                        {test.type} - {formatDate(test.date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No hay pruebas afectadas.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
