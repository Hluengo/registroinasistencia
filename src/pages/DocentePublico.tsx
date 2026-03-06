import React from 'react';
import { AlertCircle, Bell, Calendar, ChevronLeft, ChevronRight, Eye, Megaphone, PauseCircle, Pencil, PlayCircle } from 'lucide-react';
import {
  useTeacherPublicAbsences,
  TeacherPublicAbsence,
  useTeacherPublicAbsenceDetail,
  useTeacherInstantMessages,
  useManageInstantMessages,
  useCreateInstantMessage,
  useUpdateInstantMessage,
  useStudents
} from '../hooks/queries';
import { useCourses } from '../hooks/queries';
import { Modal, Button, Badge, EmptyState, PageHeader, Select, TableSkeleton } from '../components/ui';
import { formatDate } from '../utils';
import { MONTHS, getYearOptions, getCourseOptions } from '../utils/filterOptions';
import { useToast } from '../contexts/ToastContext';
import { TOAST_TYPES } from '../constants';
import { Tables } from '../types/db';

interface DocentePublicoProps {
  level: 'BASICA' | 'MEDIA';
  isStaff: boolean;
}

type CourseRow = Tables<'courses'>;
type InstantMessageRow = Tables<'instant_messages'>;

interface StaffMessagesListProps {
  messages: InstantMessageRow[];
  isLoading: boolean;
  hasError: boolean;
  courseById: Map<string, CourseRow>;
  onEdit: (message: InstantMessageRow) => void;
  onToggleActive: (id: string, nextValue: boolean) => void;
}

const StaffMessagesList: React.FC<StaffMessagesListProps> = ({
  messages,
  isLoading,
  hasError,
  courseById,
  onEdit,
  onToggleActive
}) => (
  <div className="space-y-2">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mensajes existentes</p>
    <p className="text-xs text-slate-400">Se listan todos los mensajes creados, independiente del nivel actual.</p>
    {isLoading ? (
      <p className="text-sm text-slate-400">Cargando mensajes...</p>
    ) : hasError ? (
      <p className="text-sm text-rose-600">Error al cargar mensajes para gestión.</p>
    ) : messages.length === 0 ? (
      <p className="text-sm text-slate-500">No hay mensajes creados.</p>
    ) : messages.map((message) => (
      <div key={message.id} className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{message.title}</p>
            <Badge variant={message.is_active ? 'success' : 'secondary'}>
              {message.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{message.body}</p>
          <p className="text-[11px] text-slate-400 mt-2">
            {message.level ? `Nivel ${message.level}` : 'General'}
            {message.course_id ? ` • ${courseById.get(message.course_id)?.name ?? `Curso ${message.course_id}`}` : ''}
            {message.student_id ? ` • Estudiante ${message.student_id}` : ''}
            {message.ends_at ? ` • Expira ${formatDate(message.ends_at)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            onClick={() => onEdit(message)}
          >
            Editar
          </Button>
          <Button
            size="sm"
            variant={message.is_active ? 'ghost' : 'secondary'}
            icon={message.is_active ? PauseCircle : PlayCircle}
            onClick={() => onToggleActive(message.id, !message.is_active)}
          >
            {message.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </div>
    ))}
  </div>
);

const StaffInstantMessagesManager: React.FC<{ level: 'BASICA' | 'MEDIA'; courses: CourseRow[] }> = ({ level, courses }) => {
  const [messageTitle, setMessageTitle] = React.useState('');
  const [messageBody, setMessageBody] = React.useState('');
  const [messageScope, setMessageScope] = React.useState<'GENERAL' | 'BASICA' | 'MEDIA'>('GENERAL');
  const [messageCourseId, setMessageCourseId] = React.useState('');
  const [messageStudentId, setMessageStudentId] = React.useState('');
  const [messageEndsAt, setMessageEndsAt] = React.useState('');
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const { showToast } = useToast();

  const { data: manageableMessages = [], isLoading: manageableMessagesLoading, error: manageMessagesError } = useManageInstantMessages(undefined, true);
  const createMessage = useCreateInstantMessage();
  const updateMessage = useUpdateInstantMessage();
  const { data: messageStudents = [], isLoading: messageStudentsLoading } = useStudents(
    messageCourseId || undefined,
    undefined,
    Boolean(messageCourseId)
  );

  const courseById = React.useMemo(() => new Map(courses.map((course) => [course.id, course])), [courses]);
  const messageCourseOptions = React.useMemo(() => {
    const filteredCourses = messageScope === 'GENERAL'
      ? courses
      : courses.filter((course) => course.level === messageScope);
    return [
      { value: '', label: 'Todos los cursos' },
      ...filteredCourses.map((course) => ({ value: course.id, label: `${course.name} (${course.level})` }))
    ];
  }, [courses, messageScope]);
  const messageStudentOptions = React.useMemo(() => [
    { value: '', label: 'Todos los estudiantes' },
    ...messageStudents.map((student) => ({ value: student.id, label: student.full_name }))
  ], [messageStudents]);
  const canSubmitMessage = messageTitle.trim().length >= 3 && messageBody.trim().length >= 3;
  const isEditingMessage = editingMessageId !== null;

  React.useEffect(() => {
    if (!messageCourseId && messageStudentId) {
      setMessageStudentId('');
      return;
    }
    if (messageStudentId && !messageStudents.some((student) => student.id === messageStudentId)) {
      setMessageStudentId('');
    }
  }, [messageCourseId, messageStudentId, messageStudents]);

  const toDateTimeLocalValue = (isoDate: string | null | undefined) => {
    if (!isoDate) return '';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return '';
    const adjusted = new Date(parsed.getTime() - (parsed.getTimezoneOffset() * 60000));
    return adjusted.toISOString().slice(0, 16);
  };

  const resetMessageForm = () => {
    setEditingMessageId(null);
    setMessageTitle('');
    setMessageBody('');
    setMessageScope('GENERAL');
    setMessageCourseId('');
    setMessageStudentId('');
    setMessageEndsAt('');
  };

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitMessage) return;

    const endsAtDate = messageEndsAt ? new Date(messageEndsAt) : null;
    if (endsAtDate && Number.isNaN(endsAtDate.getTime())) {
      showToast({ type: TOAST_TYPES.ERROR, message: 'La fecha de vigencia no es válida.' });
      return;
    }
    if (endsAtDate && endsAtDate.getTime() < Date.now()) {
      showToast({ type: TOAST_TYPES.WARNING, message: 'La fecha "Vigente hasta" debe ser futura.' });
      return;
    }

    try {
      if (isEditingMessage && editingMessageId) {
        await updateMessage.mutateAsync({
          id: editingMessageId,
          updates: {
            title: messageTitle.trim(),
            body: messageBody.trim(),
            level: messageScope === 'GENERAL' ? null : messageScope,
            course_id: messageCourseId || null,
            student_id: messageStudentId || null,
            ends_at: endsAtDate ? endsAtDate.toISOString() : null
          }
        });
        showToast({ type: TOAST_TYPES.SUCCESS, message: 'Mensaje instantáneo actualizado.' });
      } else {
        await createMessage.mutateAsync({
          title: messageTitle.trim(),
          body: messageBody.trim(),
          level: messageScope === 'GENERAL' ? null : messageScope,
          course_id: messageCourseId || null,
          student_id: messageStudentId || null,
          ends_at: endsAtDate ? endsAtDate.toISOString() : null,
          is_active: true
        });
        showToast({ type: TOAST_TYPES.SUCCESS, message: 'Mensaje instantáneo publicado.' });
      }

      resetMessageForm();
      if (!isEditingMessage && messageScope !== 'GENERAL' && messageScope !== level) {
        showToast({
          type: TOAST_TYPES.INFO,
          message: `El mensaje fue creado para ${messageScope}. Cambia el nivel en el selector lateral para verlo en vista docente.`
        });
      }
    } catch (error) {
      console.error('create instant message error', error);
      const message = error instanceof Error ? error.message : 'No se pudo publicar el mensaje.';
      showToast({ type: TOAST_TYPES.ERROR, message });
    }
  };

  const toggleMessageActive = async (id: string, nextValue: boolean) => {
    try {
      await updateMessage.mutateAsync({ id, updates: { is_active: nextValue } });
      showToast({ type: TOAST_TYPES.SUCCESS, message: nextValue ? 'Mensaje activado.' : 'Mensaje desactivado.' });
    } catch (error) {
      console.error('toggle instant message error', error);
      const message = error instanceof Error ? error.message : 'No se pudo actualizar el mensaje.';
      showToast({ type: TOAST_TYPES.ERROR, message });
    }
  };

  const startEditMessage = (message: InstantMessageRow) => {
    setEditingMessageId(message.id);
    setMessageTitle(message.title);
    setMessageBody(message.body);
    setMessageScope(message.level === 'BASICA' || message.level === 'MEDIA' ? message.level : 'GENERAL');
    setMessageCourseId(message.course_id ?? '');
    setMessageStudentId(message.student_id ?? '');
    setMessageEndsAt(toDateTimeLocalValue(message.ends_at));
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleCreateMessage} className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-6">
          <label htmlFor="instant-message-course" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Curso</label>
          <Select
            id="instant-message-course"
            className="mt-1"
            value={messageCourseId}
            onChange={(e) => setMessageCourseId(e.target.value)}
            options={messageCourseOptions}
          />
        </div>
        <div className="lg:col-span-6">
          <label htmlFor="instant-message-student" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
            Estudiante
          </label>
          <Select
            id="instant-message-student"
            className="mt-1"
            value={messageStudentId}
            onChange={(e) => setMessageStudentId(e.target.value)}
            options={messageStudentOptions}
            disabled={!messageCourseId || messageStudentsLoading}
          />
        </div>
        <div className="lg:col-span-6">
          <label htmlFor="instant-message-title" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Título</label>
          <input
            id="instant-message-title"
            value={messageTitle}
            onChange={(e) => setMessageTitle(e.target.value)}
            className="input-base mt-1"
            placeholder="Ej: Cambio de horario por contingencia"
            maxLength={120}
          />
        </div>
        <div className="lg:col-span-3">
          <label htmlFor="instant-message-scope" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Alcance</label>
          <Select
            id="instant-message-scope"
            className="mt-1"
            value={messageScope}
            onChange={(e) => setMessageScope(e.target.value as 'GENERAL' | 'BASICA' | 'MEDIA')}
            options={[
              { label: 'General', value: 'GENERAL' },
              { label: 'BÁSICA', value: 'BASICA' },
              { label: 'MEDIA', value: 'MEDIA' }
            ]}
          />
        </div>
        <div className="lg:col-span-3">
          <label htmlFor="instant-message-ends-at" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Vigente hasta</label>
          <input
            id="instant-message-ends-at"
            type="datetime-local"
            value={messageEndsAt}
            onChange={(e) => setMessageEndsAt(e.target.value)}
            className="input-base mt-1"
          />
        </div>
        <div className="lg:col-span-12">
          <label htmlFor="instant-message-body" className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Mensaje</label>
          <textarea
            id="instant-message-body"
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
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
              <Button type="button" variant="ghost" onClick={resetMessageForm}>
                Cancelar edición
              </Button>
            ) : null}
            <Button type="submit" loading={createMessage.isPending || updateMessage.isPending} disabled={!canSubmitMessage}>
              {isEditingMessage ? 'Guardar cambios' : 'Publicar mensaje'}
            </Button>
          </div>
        </div>
      </form>
      <StaffMessagesList
        messages={manageableMessages}
        isLoading={manageableMessagesLoading}
        hasError={Boolean(manageMessagesError)}
        courseById={courseById}
        onEdit={startEditMessage}
        onToggleActive={toggleMessageActive}
      />
    </div>
  );
};

export const DocentePublico: React.FC<DocentePublicoProps> = ({ level, isStaff }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedCourseId, setSelectedCourseId] = React.useState('');
  const [isStaffManagerOpen, setIsStaffManagerOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<TeacherPublicAbsence | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const { data = [], isLoading, isFetching, error: absencesError } = useTeacherPublicAbsences(month, year, level, selectedCourseId || undefined);
  const { data: selectedTests = [], isLoading: selectedTestsLoading } = useTeacherPublicAbsenceDetail(selected?.absence_id);
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useCourses(level, isStaff);
  const activeMessagesLevel = level;
  const { data: instantMessages = [], isLoading: instantMessagesLoading, error: messagesError } = useTeacherInstantMessages(activeMessagesLevel, selectedCourseId || undefined);
  const { data: allActiveMessages = [] } = useTeacherInstantMessages(undefined, undefined, !isStaff);

  React.useEffect(() => {
    setSelectedCourseId('');
  }, [level]);

  const loading = isLoading || coursesLoading;
  const showInitialSkeleton = loading && data.length === 0;
  const courseOptions = React.useMemo(() => getCourseOptions(courses), [courses]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Vista Docente"
        description={`Lectura pública de inasistencias y pruebas afectadas (${level === 'BASICA' ? 'Básica' : 'Media'}).`}
        breadcrumbs={[{ label: 'Vista Docente', active: true }]}
        action={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        }
        filters={
          <>
            <Select options={MONTHS} value={month} onChange={(e) => setCurrentDate(new Date(year, Number(e.target.value), 1))} className="md:w-44" />
            <Select options={getYearOptions()} value={year} onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))} className="md:w-36" />
            {isStaff ? (
              <Select
                options={courseOptions}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="md:w-64"
              />
            ) : null}
          </>
        }
      />
      {isFetching && data.length > 0 ? (
        <p className="text-xs font-medium text-slate-400 -mt-6">Actualizando resultados...</p>
      ) : null}
      {absencesError || messagesError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          No se pudieron cargar algunos datos desde Supabase.
        </div>
      ) : null}
      {coursesError && isStaff ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No se pudo cargar el listado de cursos. {' '}
          {String((coursesError as Error | undefined)?.message || 'Revisa permisos de `courses` en Supabase.')}
        </div>
      ) : null}
      <div className="card border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Comunicados</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Mensajes instantáneos</h3>
            <p className="text-sm text-slate-500 mt-1">
              {isStaff
                ? 'Vista previa staff: muestra todos los comunicados activos.'
                : 'Avisos importantes para el nivel y curso seleccionado.'}
            </p>
          </div>
          <Bell className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="mt-4 space-y-3">
          {instantMessagesLoading ? (
            <p className="text-sm text-slate-400">Cargando mensajes...</p>
          ) : instantMessages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              Sin comunicados activos en este momento.
              {!isStaff && allActiveMessages.length > 0 ? (
                <span className="block mt-1 text-xs text-slate-400">
                  Hay comunicados activos en otro nivel. Cambia BÁSICA/MEDIA desde el selector lateral.
                </span>
              ) : null}
            </div>
          ) : instantMessages.map((message) => (
            <div key={message.id} className="rounded-2xl bg-white border border-slate-200 p-4 md:p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-500">
                <Megaphone className="w-3.5 h-3.5" />
                Aviso activo
              </div>
              <h4 className="text-slate-900 font-bold mt-1">{message.title}</h4>
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{message.body}</p>
              <p className="text-[11px] text-slate-400 mt-3">
                {message.level ? `Nivel ${message.level} • ` : ''}
                Publicado: {formatDate(message.created_at)}
                {message.ends_at ? ` • Vigente hasta ${formatDate(message.ends_at)}` : ''}
              </p>
            </div>
          ))}
        </div>
      </div>

      {isStaff ? (
        <div className="card border border-amber-200/70 bg-amber-50/40 rounded-3xl p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-[0.2em]">Gestión Staff</p>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Gestor de mensajes instantáneos</h3>
              <p className="text-sm text-slate-600 mt-1">Crea avisos generales, por nivel o por curso para la vista docente.</p>
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
                <tr><td colSpan={6} className="px-6 py-12"><TableSkeleton /></td></tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <EmptyState title="Sin resultados" description="No hay inasistencias públicas para el período seleccionado." />
                  </td>
                </tr>
              ) : data.map((row) => (
                <tr key={row.absence_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-5 font-bold text-slate-900">{row.student_name}</td>
                  <td className="px-6 py-5 text-sm font-semibold text-slate-600">{row.course_name}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                      <Calendar className="w-3.5 h-3.5 opacity-60" />
                      {formatDate(row.start_date)} - {formatDate(row.end_date)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={row.status === 'JUSTIFICADA' ? 'success' : 'warning'}>{row.status}</Badge>
                  </td>
                  <td className="px-6 py-5 text-sm font-bold text-rose-600">{row.affected_tests_count}</td>
                  <td className="px-6 py-5 text-right">
                    <Button variant="ghost" size="sm" icon={Eye} onClick={() => { setSelected(row); setIsOpen(true); }}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Detalle de Inasistencia" size="lg">
        {!selected ? null : (
          <div className="space-y-5">
            <div className="text-sm text-slate-500">
              <p><span className="font-bold text-slate-700">Estudiante:</span> {selected.student_name}</p>
              <p><span className="font-bold text-slate-700">Curso:</span> {selected.course_name}</p>
              <p><span className="font-bold text-slate-700">Fechas:</span> {formatDate(selected.start_date)} - {formatDate(selected.end_date)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Observación</p>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm">
                {selected.observation || 'Sin observación registrada.'}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Pruebas Afectadas ({selected.affected_tests_count})</p>
              {selectedTestsLoading ? (
                <p className="text-sm text-slate-400">Cargando detalle...</p>
              ) : selectedTests.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTests.map((test) => (
                    <div key={test.id} className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-sm">
                      <div className="font-bold text-slate-800">{test.subject}</div>
                      <div className="text-rose-600 font-medium">{test.type} - {formatDate(test.date)}</div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-400">No hay pruebas afectadas.</p>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
