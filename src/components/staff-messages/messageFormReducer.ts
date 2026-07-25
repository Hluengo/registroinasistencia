import { Tables } from '../../types/db'

type InstantMessageRow = Tables<'instant_messages'>

export const toDateTimeLocalValue = (isoDate: string | null | undefined) => {
  if (!isoDate) return ''
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return ''
  const adjusted = new Date(
    parsed.getTime() - parsed.getTimezoneOffset() * 60000
  )
  return adjusted.toISOString().slice(0, 16)
}

export interface MessageFormState {
  title: string
  body: string
  scope: 'GENERAL' | 'BASICA' | 'MEDIA'
  courseId: string
  studentId: string
  endsAt: string
  editingMessageId: string | null
}

export const initialMessageFormState: MessageFormState = {
  title: '',
  body: '',
  scope: 'GENERAL',
  courseId: '',
  studentId: '',
  endsAt: '',
  editingMessageId: null,
}

export type MessageFormAction =
  | { type: 'RESET' }
  | { type: 'SET'; payload: Partial<MessageFormState> }
  | { type: 'START_EDIT'; message: InstantMessageRow }

export function messageFormReducer(
  state: MessageFormState,
  action: MessageFormAction
): MessageFormState {
  switch (action.type) {
    case 'RESET':
      return initialMessageFormState
    case 'SET':
      return { ...state, ...action.payload }
    case 'START_EDIT': {
      const m = action.message
      return {
        title: m.title,
        body: m.body,
        scope:
          m.level === 'BASICA' || m.level === 'MEDIA' ? m.level : 'GENERAL',
        courseId: m.course_id ?? '',
        studentId: m.student_id ?? '',
        endsAt: toDateTimeLocalValue(m.ends_at),
        editingMessageId: m.id,
      }
    }
    default:
      return state
  }
}
