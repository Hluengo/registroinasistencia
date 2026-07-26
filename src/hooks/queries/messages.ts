import { supabase } from '../../services/supabaseClient';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { QUERY_KEYS_INVALIDATE } from '../../constants';
import { useQ, queryKeys } from './utils';
import {
  TeacherInstantMessage,
  InstantMessageRow,
  InstantMessageInsertRow,
  InstantMessageUpdateRow,
} from './types';

export const useTeacherInstantMessages = (
  level?: 'BASICA' | 'MEDIA',
  courseId?: string,
  isAuthenticated: boolean = false
) => {
  const visibility = isAuthenticated ? 'staff' : 'public';

  return useQ<TeacherInstantMessage[]>(
    queryKeys.teacherInstantMessages(level, courseId, visibility),
    async () => {
      const params: { p_level: string | null; p_course_id: string | null } = {
        p_level: level ?? null,
        p_course_id: courseId ?? null,
      };
      const rpcName = isAuthenticated
        ? 'teacher_get_instant_messages'
        : 'teacher_get_public_instant_messages';
      const { data, error } = await supabase.rpc(rpcName, params);
      if (error) throw error;
      return (data || []) as TeacherInstantMessage[];
    },
    {
      staleTime: 60_000,
      refetchInterval: (query) => (query.state.status === 'error' ? false : 60_000),
      refetchIntervalInBackground: false,
      enabled: true,
    }
  );
};

export const useManageInstantMessages = (level?: 'BASICA' | 'MEDIA', enabled: boolean = true) => {
  return useQ<InstantMessageRow[]>(
    queryKeys.instantMessagesManage(level),
    async () => {
      let query = supabase
        .from('instant_messages')
        .select(
          'id, title, body, level, course_id, student_id, is_active, starts_at, ends_at, created_at, updated_at, created_by'
        )
        .order('created_at', { ascending: false });
      if (level) {
        query = query.or(`level.eq.${level},level.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as InstantMessageRow[];
    },
    { enabled }
  );
};

export const useCreateInstantMessage = () => {
  const qc = useQueryClient();
  return useMutation<
    InstantMessageRow,
    Error,
    Omit<InstantMessageInsertRow, 'id' | 'created_at' | 'updated_at'>
  >({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from('instant_messages')
        .insert(payload)
        .select('*')
        .single();
      if (error) {
        const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ');
        throw new Error(details || 'No se pudo crear el mensaje instantáneo.');
      }
      return data as InstantMessageRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.TEACHER_INSTANT_MESSAGES,
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.INSTANT_MESSAGES_MANAGE,
      });
    },
  });
};

export const useUpdateInstantMessage = () => {
  const qc = useQueryClient();
  return useMutation<InstantMessageRow, Error, { id: string; updates: InstantMessageUpdateRow }>({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('instant_messages')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) {
        const details = [error.message, error.details, error.hint].filter(Boolean).join(' | ');
        throw new Error(details || 'No se pudo actualizar el mensaje instantáneo.');
      }
      return data as InstantMessageRow;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.TEACHER_INSTANT_MESSAGES,
      });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS_INVALIDATE.INSTANT_MESSAGES_MANAGE,
      });
    },
  });
};