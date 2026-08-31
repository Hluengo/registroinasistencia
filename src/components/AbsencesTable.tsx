import React from 'react'
import { Calendar } from 'lucide-react'
import { AbsenceWithDetails, Course } from '../types'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { EmptyState } from './ui/EmptyState'
import { TableSkeleton } from './ui/Skeleton'
import { formatDate } from '../utils'
import { getAbsenceStatusLabel } from '../constants'

export interface FlatAbsenceRow {
  absence_id: string
  student_name: string
  course_name: string
  start_date: string
  end_date: string
  status: string
  observation?: string | null
  document_url?: string | null
  affected_tests_count: number
}

interface AbsencesTableProps {
  absences: AbsenceWithDetails[] | FlatAbsenceRow[]
  courses?: Course[]
  loading: boolean
  onViewDetail: (absence: AbsenceWithDetails | FlatAbsenceRow) => void
  expandable?: boolean
  expandedRows?: Set<string>
  onToggleRow?: (id: string) => void
  showDocumentButton?: boolean
  title?: string
  showHeader?: boolean
  emptyTitle?: string
  emptyDescription?: string
}

function isFlatRow(
  row: AbsenceWithDetails | FlatAbsenceRow
): row is FlatAbsenceRow {
  return 'absence_id' in row || 'student_name' in row
}

function getKey(row: AbsenceWithDetails | FlatAbsenceRow): string {
  if (isFlatRow(row)) return row.absence_id
  return row.id
}

function getStudentName(row: AbsenceWithDetails | FlatAbsenceRow): string {
  if (isFlatRow(row)) return row.student_name
  return row.student?.full_name || 'N/A'
}

function getCourseName(
  row: AbsenceWithDetails | FlatAbsenceRow,
  courses?: Course[]
): string {
  if (isFlatRow(row)) return row.course_name
  if (courses && row.student?.course_id) {
    return courses.find((c) => c.id === row.student.course_id)?.name || 'N/A'
  }
  return row.student?.course?.name || 'N/A'
}

function getStatus(row: AbsenceWithDetails | FlatAbsenceRow): string {
  if (isFlatRow(row)) return row.status || 'PENDIENTE'
  return row.status || 'PENDIENTE'
}

function getAffectedTestsCount(
  row: AbsenceWithDetails | FlatAbsenceRow
): number {
  if (isFlatRow(row)) return row.affected_tests_count
  return row.affected_tests?.length || 0
}

function getDocumentUrl(
  row: AbsenceWithDetails | FlatAbsenceRow
): string | null {
  if (isFlatRow(row)) return row.document_url || null
  return row.document_url || null
}

export const AbsencesTable: React.FC<AbsencesTableProps> = ({
  absences,
  courses = [],
  loading,
  onViewDetail,
  showDocumentButton = false,
  title,
  showHeader = false,
  emptyTitle = 'No se encontraron inasistencias',
  emptyDescription = 'Prueba ajustando los filtros para ver más resultados.',
}) => {
  const renderRow = (absence: AbsenceWithDetails | FlatAbsenceRow) => {
    const key = getKey(absence)
    const studentName = getStudentName(absence)
    const courseName = getCourseName(absence, courses)
    const status = getStatus(absence)
    const affectedTests = getAffectedTestsCount(absence)
    const docUrl = getDocumentUrl(absence)
    const startDate = isFlatRow(absence)
      ? absence.start_date
      : absence.start_date
    const endDate = isFlatRow(absence) ? absence.end_date : absence.end_date

    return (
      <React.Fragment key={key}>
        <tr className="hover:bg-slate-50/80 transition-colors group">
          <td className="px-6 py-5">
            <div className="font-bold text-slate-900 tracking-tight">
              {studentName}
            </div>
          </td>
          <td className="px-6 py-5">
            <span className="text-sm font-semibold text-slate-600 bg-slate-100/50 px-2 py-1 rounded-lg border border-slate-200/50">
              {courseName}
            </span>
          </td>
          <td className="px-6 py-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Calendar className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} />
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
          </td>
          <td className="px-6 py-5">
            {affectedTests > 0 ? (
              <span className="text-rose-600 font-bold text-xs uppercase tracking-wider">
                {affectedTests} pruebas
              </span>
            ) : (
              <span className="text-slate-300 text-xs font-medium italic">
                Ninguna
              </span>
            )}
          </td>
          <td className="px-6 py-5">
            <Badge variant={status === 'JUSTIFICADA' ? 'success' : 'warning'}>
              {getAbsenceStatusLabel(status)}
            </Badge>
          </td>
          <td className="px-6 py-5 text-right">
            <div className="flex items-center justify-end gap-2">
              {showDocumentButton && docUrl && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  Doc
                </a>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetail(absence)}
                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
              >
                Ver Detalle
              </Button>
            </div>
          </td>
        </tr>
      </React.Fragment>
    )
  }

  return (
    <div className="card overflow-hidden border border-slate-200/60 shadow-sm shadow-slate-200/20 rounded-3xl">
      {showHeader && title && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {absences.length > 0 && (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              {absences.length}
            </span>
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Estudiante</th>
              <th className="px-6 py-4">Curso</th>
              <th className="px-6 py-4">Periodo</th>
              <th className="px-6 py-4">Pruebas</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <TableSkeleton />
                </td>
              </tr>
            ) : absences.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              absences.map((absence) => renderRow(absence))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
