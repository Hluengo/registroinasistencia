import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar } from 'lucide-react';
import { useCreateAbsence, useUpdateAbsence } from '../hooks/queries';
import { useToast } from '../contexts/ToastContext';
import { createMutationGuard } from '../utils';
import { AbsenceWithDetails, Course, Student } from '../types';
import { useAbsences, useCourses, useStudents } from '../hooks/queries';
import { formatDate, cn, toLocalDateString } from '../utils';
import { Button, Badge, EmptyState, PageHeader, Input, Select, TableSkeleton } from '../components/ui';
import { InasistenciasCreateModal } from './InasistenciasCreateModal';
import { InasistenciasDetailModal } from './InasistenciasDetailModal';
import { MONTHS, getYearOptions, getCourseOptions } from '../utils/filterOptions';
import { TOAST_TYPES, getAbsenceStatusLabel } from '../constants';

interface InasistenciasProps {
  level: 'BASICA' | 'MEDIA';
}

export const Inasistencias: React.FC<InasistenciasProps> = ({ level }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [uiState, patchUiState] = React.useReducer(
    (
      state: {
        mutationLoading: boolean;
        isModalOpen: boolean;
        selectedAbsence: AbsenceWithDetails | null;
        isDetailModalOpen: boolean;
        isEditing: boolean;
        filters: { courseId: string; month: number; year: number; searchQuery: string };
        file: File | null;
      },
      patch: Partial<{
        mutationLoading: boolean;
        isModalOpen: boolean;
        selectedAbsence: AbsenceWithDetails | null;
        isDetailModalOpen: boolean;
        isEditing: boolean;
        filters: { courseId: string; month: number; year: number; searchQuery: string };
        file: File | null;
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
  );
  const { mutationLoading, isModalOpen, selectedAbsence, isDetailModalOpen, isEditing, filters, file } = uiState;
  const { showToast } = useToast();

  // derive start/end ISO dates from filters
  const startISO = toLocalDateString(new Date(filters.year, filters.month, 1));
  const endISO = toLocalDateString(new Date(filters.year, filters.month + 1, 0));

  const { data: absences = [], isLoading: loadingAbsences } = useAbsences(level, startISO, endISO);
  const { data: coursesData = [], isLoading: loadingCourses } = useCourses(level);
  const { data: studentsData = [], isLoading: loadingStudents } = useStudents(undefined, level, isModalOpen);

  // local copies / derived state
  useEffect(() => {
    const next = coursesData || [];
    setCourses((prev) => {
      if (prev.length === next.length && prev.every((p, i) => p.id === next[i]?.id)) {
        return prev;
      }
      return next;
    });
  }, [coursesData]);
  useEffect(() => {
    const next = studentsData || [];
    setStudents((prev) => {
      if (prev.length === next.length && prev.every((p, i) => p.id === next[i]?.id)) {
        return prev;
      }
      return next;
    });
  }, [studentsData]);

  const loading = loadingAbsences || loadingCourses || loadingStudents;

  useEffect(() => {
    const handleGlobalSearch = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail?.query) {
        patchUiState({ filters: { ...filters, searchQuery: customEvent.detail.query } });
      }
    };
    window.addEventListener('global-search', handleGlobalSearch);
    return () => window.removeEventListener('global-search', handleGlobalSearch);
  }, [filters]);

  // data comes from hooks; no imperative loadData

const filteredAbsences = React.useMemo(() =>
    absences.filter((abs: AbsenceWithDetails) => {
      const studentCourseId = abs.student?.course_id || (abs.student as unknown as { course?: { id?: string } })?.course?.id || '';
      const matchesCourse = filters.courseId === '' || studentCourseId === filters.courseId;
      
      if (!filters.searchQuery) return matchesCourse;
      
      const searchLower = filters.searchQuery.toLowerCase();
      const studentName = abs.student?.full_name?.toLowerCase() || '';
      const studentRut = abs.student?.rut?.toLowerCase() || '';
      const matchesSearch = studentName.includes(searchLower) || studentRut.includes(searchLower);
      
      return matchesCourse && matchesSearch;
    }),

    [absences, filters.courseId, filters.searchQuery]
  );

  const courseOptions = getCourseOptions(courses);

  const handleViewDetail = (abs: AbsenceWithDetails) => {
    patchUiState({ selectedAbsence: abs, isDetailModalOpen: true, isEditing: false });
  };

  const updateAbsence = useUpdateAbsence();

  const onUpdate = async (data: Partial<Omit<import('../types').Absence, 'id' | 'created_at'>>) => {
    if (!selectedAbsence) return;
    if (!createMutationGuard(mutationLoading, () => showToast({ type: TOAST_TYPES.WARNING, message: 'Ya se está procesando una actualización' }))) {
      return;
    }
    try {
      patchUiState({ mutationLoading: true });
      const res = await updateAbsence.mutateAsync({ id: selectedAbsence.id, updates: { observation: data.observation }, file: file || undefined });
      patchUiState({ isDetailModalOpen: false, isEditing: false, file: null });
      if (!res) {
        showToast({ type: TOAST_TYPES.ERROR, message: 'Error al actualizar la inasistencia' });
        return;
      }
      if (res.success) {
        showToast({ type: TOAST_TYPES.SUCCESS, message: 'Inasistencia actualizada exitosamente' });
        if (file && res.row?.document_url) {
          showToast({ type: TOAST_TYPES.SUCCESS, message: `Documento ${file.name} subido exitosamente` });
        }
      } else {
        showToast({ type: TOAST_TYPES.WARNING, message: res.error || 'La inasistencia se guardó, pero hubo un problema con el documento.' });
      }
    } catch (error) {
      console.error('Error updating absence:', error);
      showToast({ type: TOAST_TYPES.ERROR, message: 'Error al actualizar la inasistencia' });
    } finally {
      patchUiState({ mutationLoading: false });
    }
  };

  const createAbsence = useCreateAbsence();

  const onSubmit = async (data: any) => {
    if (!createMutationGuard(mutationLoading, () => showToast({ type: TOAST_TYPES.WARNING, message: 'Ya se está procesando un registro' }))) {
      return;
    }
    try {
      patchUiState({ mutationLoading: true });
      const res = await createAbsence.mutateAsync({ absence: {
        student_id: data.student_id,
        start_date: data.start_date,
        end_date: data.end_date,
        observation: data.observation ?? null,
        document_url: null,
        status: 'PENDIENTE'
      }, file: file || undefined });
      patchUiState({ isModalOpen: false, file: null });
      if (!res) {
        showToast({ type: TOAST_TYPES.ERROR, message: 'Error al registrar la inasistencia' });
        return;
      }
      if (res.success) {
        showToast({ type: TOAST_TYPES.SUCCESS, message: 'Inasistencia registrada exitosamente' });
        if (file && res.row?.document_url) {
          showToast({ type: TOAST_TYPES.SUCCESS, message: `Documento ${file.name} subido exitosamente` });
        }
      } else {
        showToast({ type: TOAST_TYPES.WARNING, message: res.error || 'La inasistencia se registró, pero hubo un problema con el documento.' });
      }
    } catch (error) {
      console.error('Error creating absence:', error);
      showToast({ type: TOAST_TYPES.ERROR, message: 'Error al registrar la inasistencia' });
    } finally {
      patchUiState({ mutationLoading: false });
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader 
        title="Gestión de Inasistencias"
        description={`Control de ausencias y justificaciones para Educación ${level === 'BASICA' ? 'Básica' : 'Media'}.`}
        breadcrumbs={[{ label: 'Inasistencias', active: true }]}
        action={
          <Button data-testid="open-register-absence" onClick={() => patchUiState({ isModalOpen: true })} icon={Plus}>
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
                onChange={(e) => patchUiState({ filters: { ...filters, searchQuery: e.target.value } })}
              />
            </div>
            <div className="lg:col-span-2">
              <Select 
                options={MONTHS}
                value={filters.month}
                onChange={(e) => patchUiState({ filters: { ...filters, month: parseInt(e.target.value) } })}
              />
            </div>
            <div className="lg:col-span-2">
              <Select 
                options={getYearOptions()}
                value={filters.year}
                onChange={(e) => patchUiState({ filters: { ...filters, year: parseInt(e.target.value) } })}
              />
            </div>
            <div className="lg:col-span-3">
              <Select 
                options={courseOptions}
                value={filters.courseId}
                onChange={(e) => patchUiState({ filters: { ...filters, courseId: e.target.value } })}
              />
            </div>
            {(filters.courseId || filters.searchQuery) && (
              <div className="lg:col-span-12 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => patchUiState({ filters: { ...filters, courseId: '', searchQuery: '' } })}
                  className="font-bold text-slate-500 hover:text-indigo-600"
                >
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>
        }
      />

      <div className="card overflow-hidden border border-slate-200/60 shadow-sm shadow-slate-200/20 rounded-3xl">
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
                  <td colSpan={6} className="px-6 py-12"><TableSkeleton /></td>
                </tr>
              ) : filteredAbsences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState 
                      title="No se encontraron inasistencias" 
                      description="Prueba ajustando los filtros o busca otro estudiante."
                    />
                  </td>
                </tr>
              ) : filteredAbsences.map((abs: AbsenceWithDetails) => (
                <tr key={abs.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 tracking-tight">{abs.student.full_name}</div>
                    <div className="text-[11px] font-medium text-slate-400">RUT: {abs.student.rut || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-semibold text-slate-600 bg-slate-100/50 px-2 py-1 rounded-lg border border-slate-200/50">{courses.find(c => c.id === abs.student.course_id)?.name || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Calendar className="w-3.5 h-3.5 opacity-60" strokeWidth={1.5} />
                      {formatDate(abs.start_date)} - {formatDate(abs.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {abs.affected_tests && abs.affected_tests.length > 0 ? (
                      <span className="text-rose-600 font-bold text-xs uppercase tracking-wider">{abs.affected_tests.length} pruebas</span>
                    ) : (
                      <span className="text-slate-300 text-xs font-medium italic">Ninguna</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={abs.status === 'JUSTIFICADA' ? 'success' : 'warning'}>
                      {getAbsenceStatusLabel(abs.status || 'PENDIENTE')}
                    </Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetail(abs)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                      Ver Detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InasistenciasCreateModal
        isOpen={isModalOpen}
        onClose={() => patchUiState({ isModalOpen: false })}
        file={file}
        onFileChange={(f) => patchUiState({ file: f })}
        courses={courses}
        students={students}
        loading={loading}
        mutationLoading={mutationLoading}
        onSubmit={onSubmit}
        level={level}
      />

      <InasistenciasDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => patchUiState({ isDetailModalOpen: false })}
        selectedAbsence={selectedAbsence}
        courses={courses}
        isEditing={isEditing}
        onEditToggle={(editing) => patchUiState({ isEditing: editing })}
        file={file}
        onFileChange={(f) => patchUiState({ file: f })}
        loading={loading}
        onUpdate={onUpdate}
      />
    </div>
  );
};
