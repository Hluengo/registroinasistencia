import React from 'react'
import { Pencil, PauseCircle, PlayCircle } from 'lucide-react'
import { Tables } from '../../types/db'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { formatDate } from '../../utils'

type CourseRow = Tables<'courses'>
type InstantMessageRow = Tables<'instant_messages'>

interface StaffMessagesListProps {
  messages: InstantMessageRow[]
  isLoading: boolean
  hasError: boolean
  courseById: Map<string, CourseRow>
  onEdit: (message: InstantMessageRow) => void
  onToggleActive: (id: string, nextValue: boolean) => void
}

export const StaffMessagesList: React.FC<StaffMessagesListProps> = ({
  messages,
  isLoading,
  hasError,
  courseById,
  onEdit,
  onToggleActive,
}) => (
  <div className="space-y-2">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
      Mensajes existentes
    </p>
    <p className="text-xs text-slate-400">
      Se listan todos los mensajes creados, independiente del nivel actual.
    </p>
    {isLoading ? (
      <p className="text-sm text-slate-400">Cargando mensajes...</p>
    ) : hasError ? (
      <p className="text-sm text-rose-600">
        Error al cargar mensajes para gestión.
      </p>
    ) : messages.length === 0 ? (
      <p className="text-sm text-slate-500">No hay mensajes creados.</p>
    ) : (
      messages.map((message) => (
        <div
          key={message.id}
          className="rounded-2xl bg-white border border-slate-200 p-4 flex items-start justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{message.title}</p>
              <Badge variant={message.is_active ? 'success' : 'secondary'}>
                {message.is_active ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">
              {message.body}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              {message.level ? `Nivel ${message.level}` : 'General'}
              {message.course_id
                ? ` • ${courseById.get(message.course_id)?.name ?? `Curso ${message.course_id}`}`
                : ''}
              {message.student_id ? ` • Estudiante ${message.student_id}` : ''}
              {message.ends_at
                ? ` • Expira ${formatDate(message.ends_at)}`
                : ''}
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
      ))
    )}
  </div>
)
