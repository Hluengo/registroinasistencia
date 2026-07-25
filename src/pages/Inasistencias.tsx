import React, { useState, useEffect } from 'react'
import { Plus, Search, Calendar } from 'lucide-react'
import { useCreateAbsence, useUpdateAbsence } from '../hooks/queries'
import { useToast } from '../contexts/ToastContext'
import { createMutationGuard } from '../utils'
import { AbsenceWithDetails, Course, Student } from '../types'
import { useAbsences, useCourses, useStudents } from '../hooks/queries'
import { formatDate, cn, toLocalDateString } from '../utils'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { AbsencesTable } from '../components/AbsencesTable'
import { InasistenciasCreateModal } from './InasistenciasCreateModal'
import { InasistenciasDetailModal } from './InasistenciasDetailModal'
import {
  MONTHS,
  getYearOptions,
  getCourseOptions,
} from '../utils/filterOptions'
import { TOAST_TYPES, getAbsenceStatusLabel } from '../constants'
import { absenceValidationSchema } from '../lib/validators'
import type { z } from 'zod'

interface InasistenciasProps {
  level: 'BASICA' | 'MEDIA'
}

export const Inasistencias: React.FC<InasistenciasProps> = ({ level }) => {
  const [uiState, patchUiState] = React.useReducer(
    (
      state: {
        mutationLoading: boolean
        isModalOpen: boolean
        selectedAbsence: AbsenceWithDetails | null
        isDetailModalOpen: boolean
        isEditing: boolean
        filters: {
          courseId: string
          month: number
          year: number
          searchQuery: string
        }
        file: File | null
      },
      patch: Partial<{
        mutationLoading: boolean
        isModalOpen: boolean
        selectedAbsence: AbsenceWithDetails | null
        isDetailModalOpen: boolean
        isEditing: boolean
        filters: {
          courseId: string
          month: number
          year: number
          searchQuery: string
        }
        file: File | null
      }>
    ) => ({ ...state, ...patch }),
    {
      mutationLoading: false,
      isModalOpen: false,
      selectedAbsence: null,
      isDetailModalOpen: false,
      isEditing: false,
      filters: {
        courseId: '',
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        searchQuery: '',
      },
      file: null,
    }
  )
  const {
    mutationLoading,
    isModalOpen,
    selectedAbsence,
    isDetailModalOpen,
    isEditing,
    filters,
    file,
  } = uiState
  const { showToast } = useToast()

  // derive start/end ISO dates from filters
  const startISO = toLocalDateString(new Date(filters.year, filters.month, 1))
  const endISO = toLocalDateString(new Date(filters.year, filters.month + 1, 0))

  const { data: absences = [], isLoading: loadingAbsences } = useAbsences(
    level,
    startISO,
    endISO
  )
  const { data: coursesData = [], isLoading: loadingCourses } =
    useCourses(level)
  const { data: studentsData = [], isLoading: loadingStudents } = useStudents(
    undefined,
    level,
    isModalOpen
  )

  const loading = loadingAbsences || loadingCourses || loadingStudents

  const filtersRef = React.useRef(filters)
  filtersRef.current = filters

  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>
      if (customEvent.detail?.query) {
        patchUiState({
          filters: { ...filtersRef.current, searchQuery: customEvent.detail.query },
        })
      }
    }
    window.addEventListener('global-search', handleGlobalSearch)
    return () => window.removeEventListener('global-search', handleGlobalSearch)
  }, [])

  // data comes from hooks; no imperative loadData

  const filteredAbsences = React.useMemo(
    () =>
      absences.filter((abs: AbsenceWithDetails) => {
        const studentCourseId =
          abs.student?.course_id ||
          (abs.student as unknown as { course?: { id?: string } })?.course
            ?.id ||
          ''
        const matchesCourse =
          filters.courseId === '' || studentCourseId === filters.courseId

        if (!filters.searchQuery) return matchesCourse

        const searchLower = filters.searchQuery.toLowerCase()
        const studentName = abs.student?.full_name?.toLowerCase() || ''
        const studentRut = abs.student?.rut?.toLowerCase() || ''
        const matchesSearch =
          studentName.includes(searchLower) || studentRut.includes(searchLower)

        return matchesCourse && matchesSearch
      }),
    [absences, filters.courseId, filters.searchQuery]
  )

  const courseOptions = getCourseOptions(coursesData)

  const handleViewDetail = (abs: AbsenceWithDetails | import('../components/AbsencesTable').FlatAbsenceRow) => {
    patchUiState({
      selectedAbsence: abs as AbsenceWithDetails,
      isDetailModalOpen: true,
      isEditing: false,
    })
  }

  const updateAbsence = useUpdateAbsence()

  const onUpdate = async (
    data: Partial<Omit<import('../types').Absence, 'id' | 'created_at'>>
  ) => {
    if (!selectedAbsence) return
    if (
      !createMutationGuard(mutationLoading, () =>
        showToast({
          type: TOAST_TYPES.WARNING,
          message: 'Ya se está procesando una actualización',
        })
      )
    ) {
      return
    }
    try {
      patchUiState({ mutationLoading: true })
      const res = await updateAbsence.mutateAsync({
        id: selectedAbsence.id,
        updates: { observation: data.observation },
        file: file || undefined,
      })
      patchUiState({ isDetailModalOpen: false, isEditing: false, file: null })
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: 'Inasistencia actualizada exitosamente',
      })
      if (file && res?.document_url) {
        showToast({
          type: TOAST_TYPES.SUCCESS,
          message: `Documento ${file.name} subido exitosamente`,
        })
      }
    } catch (error) {
      console.error('Error updating absence:', error)
      showToast({
        type: TOAST_TYPES.ERROR,
        message: 'Error al actualizar la inasistencia',
      })
    } finally {
      patchUiState({ mutationLoading: false })
    }
  }

  const createAbsence = useCreateAbsence()

  const onSubmit = async (data: z.infer<typeof absenceValidationSchema>) => {
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
      const res = await createAbsence.mutateAsync({
        absence: {
          student_id: data.student_id,
          start_date: data.start_date,
          end_date: data.end_date,
          observation: data.observation ?? null,
          document_url: null,
          status: 'PENDIENTE',
        },
        file: file || undefined,
      })
      patchUiState({ isModalOpen: false, file: null })
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: 'Inasistencia registrada exitosamente',
      })
      if (file && res?.document_url) {
        showToast({
          type: TOAST_TYPES.SUCCESS,
          message: `Documento ${file.name} subido exitosamente`,
        })
      }
    } catch (error) {
      console.error('Error creating absence:', error)
      patchUiState({ isModalOpen: false, file: null })
      showToast({
        type: TOAST_TYPES.ERROR,
        message: 'Error al registrar la inasistencia',
      })
    } finally {
      patchUiState({ mutationLoading: false })
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Gestión de Inasistencias"
        description={`Control de ausencias y justificaciones para Educación ${level === 'BASICA' ? 'Básica' : 'Media'}.`}
        breadcrumbs={[{ label: 'Inasistencias', active: true }]}
        action={
          <Button
            data-testid="open-register-absence"
            onClick={() => patchUiState({ isModalOpen: true })}
            icon={Plus}
          >
            Registrar Inasistencia
          </Button>
        }
        filters={
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-5">
              <Input
                placeholder="Buscar por nombre o RUT..."
                icon={<Search className="w-4 h-4" />}
                value={filters.searchQuery}
                onChange={(e) =>
                  patchUiState({
                    filters: { ...filters, searchQuery: e.target.value },
                  })
                }
              />
            </div>
            <div className="lg:col-span-2">
              <Select
                options={MONTHS}
                value={filters.month}
                onChange={(e) =>
                  patchUiState({
                    filters: { ...filters, month: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div className="lg:col-span-2">
              <Select
                options={getYearOptions()}
                value={filters.year}
                onChange={(e) =>
                  patchUiState({
                    filters: { ...filters, year: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div className="lg:col-span-3">
              <Select
                options={courseOptions}
                value={filters.courseId}
                onChange={(e) =>
                  patchUiState({
                    filters: { ...filters, courseId: e.target.value },
                  })
                }
              />
            </div>
            {(filters.courseId || filters.searchQuery) && (
              <div className="lg:col-span-12 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patchUiState({
                      filters: { ...filters, courseId: '', searchQuery: '' },
                    })
                  }
                  className="font-bold text-slate-500 hover:text-indigo-600"
                >
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>
        }
      />

      <AbsencesTable
        loading={loading}
        absences={filteredAbsences}
        courses={coursesData}
        onViewDetail={handleViewDetail}
      />

      <InasistenciasCreateModal
        isOpen={isModalOpen}
        onClose={() => patchUiState({ isModalOpen: false })}
        file={file}
        onFileChange={(f) => patchUiState({ file: f })}
        courses={coursesData}
        students={studentsData}
        loading={loading}
        mutationLoading={mutationLoading}
        onSubmit={onSubmit}
        level={level}
      />

      <InasistenciasDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => patchUiState({ isDetailModalOpen: false })}
        selectedAbsence={selectedAbsence}
        courses={coursesData}
        isEditing={isEditing}
        onEditToggle={(editing) => patchUiState({ isEditing: editing })}
        file={file}
        onFileChange={(f) => patchUiState({ file: f })}
        loading={loading}
        onUpdate={onUpdate}
      />
    </div>
  )
}
