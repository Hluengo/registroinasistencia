import React from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { isUsingPlaceholder } from '../lib/supabaseClient';

type AppRole = 'teacher' | 'staff' | 'superuser' | null;
const GET_SESSION_TIMEOUT_MS = 20000;
const ROLE_TIMEOUT_MS = 12000;
const INVALID_REFRESH_TOKEN_RE = /(invalid refresh token|refresh token not found|invalid_grant)/i;

const TIMEOUT = Symbol('timeout');

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMEOUT> {
  return Promise.race([
    promise,
    new Promise<typeof TIMEOUT>((resolve) => setTimeout(() => resolve(TIMEOUT), ms))
  ]);
}

async function getSessionWithRetry() {
  const first = await withTimeout(supabase.auth.getSession(), GET_SESSION_TIMEOUT_MS);
  if (first !== TIMEOUT) return first;
  console.warn('useAuth.bootstrap: getSession timeout (1), retrying once...');
  return withTimeout(supabase.auth.getSession(), GET_SESSION_TIMEOUT_MS);
}

function isInvalidRefreshTokenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return INVALID_REFRESH_TOKEN_RE.test(message);
}

export function useAuth() {
  const [session, setSession] = React.useState<Session | null>(null);
  const [role, setRole] = React.useState<AppRole>(null);
  const [loading, setLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const normalizeRole = React.useCallback((value: unknown): AppRole => {
    if (value === 'staff' || value === 'superuser' || value === 'teacher') return value;
    return null;
  }, []);

  const refreshRole = React.useCallback(async (userId?: string | null): Promise<AppRole> => {
    if (!userId) {
      setRole(null);
      return null;
    }

    try {
      // Fuente principal en frontend: profiles del usuario autenticado.
      const profileRes = await withTimeout(
        Promise.resolve(
          supabase
            .from('profiles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle()
        ),
        ROLE_TIMEOUT_MS
      );

      if (profileRes !== TIMEOUT) {
        const { data, error } = profileRes;
        const fromProfile = normalizeRole(data?.role);
        if (!error && fromProfile) {
          setRole(fromProfile);
          return fromProfile;
        }

        if (error) {
          console.error('useAuth.refreshRole profiles error', error);
        }
      } else {
        console.warn('useAuth.refreshRole profiles timeout');
      }

      // Fallback: RPC current_role si profiles no devolvió rol.
      const rpcRes = await withTimeout(Promise.resolve(supabase.rpc('current_role')), ROLE_TIMEOUT_MS);
      if (rpcRes !== TIMEOUT) {
        const { data: rpcRole, error: rpcErr } = rpcRes;
        const fromRpc = normalizeRole(rpcRole);
        if (!rpcErr && fromRpc) {
          setRole(fromRpc);
          return fromRpc;
        }

        if (rpcErr) {
          console.error('useAuth.refreshRole rpc current_role error', rpcErr);
        }
      } else {
        console.warn('useAuth.refreshRole current_role timeout');
      }
    } catch (err) {
      console.error('useAuth.refreshRole unexpected error', err);
    }

    // Nunca romper sesión por fallo de rol; fallback seguro.
    setRole('teacher');
    return 'teacher';
  }, [normalizeRole]);

  React.useEffect(() => {
    let mounted = true;
    let roleRefreshTimer: ReturnType<typeof setTimeout> | null = null;

    const bootstrap = async () => {
      setLoading(true);

      try {
        if (isUsingPlaceholder) {
          console.warn('useAuth.bootstrap: skipping Supabase calls due to placeholder configuration');
          setSession(null);
          setRole(null);
          return;
        }
        console.log('useAuth.bootstrap: calling supabase.auth.getSession');
        const sessionRes = await getSessionWithRetry();
        if (sessionRes === TIMEOUT) {
          console.warn('useAuth.bootstrap: getSession timeout');
          setAuthError('Tiempo de espera agotado al verificar sesión.');
          setSession(null);
          setRole(null);
          return;
        }
        const { data, error } = sessionRes;
        if (error && isInvalidRefreshTokenError(error)) {
          console.warn('useAuth.bootstrap: invalid refresh token detected; clearing local session');
          await supabase.auth.signOut({ scope: 'local' });
          setSession(null);
          setRole(null);
          setAuthError(null);
          return;
        }
        if (error) throw error;
        if (!mounted) return;
        const nextSession = data.session ?? null;
        setSession(nextSession);
        setAuthError(null);
        await refreshRole(nextSession?.user?.id ?? null);
      } catch (error) {
        console.error('useAuth.bootstrap error', error);
        if (mounted) {
          if (isInvalidRefreshTokenError(error)) {
            console.warn('useAuth.bootstrap: invalid refresh token during recovery; clearing local session');
            await supabase.auth.signOut({ scope: 'local' });
            setSession(null);
            setRole(null);
            setAuthError(null);
            return;
          }
          // Mantener cualquier sesión existente; no degradar a invitado por error transitorio.
          try {
            const { data } = await supabase.auth.getSession();
            const nextSession = data.session ?? null;
            setSession(nextSession);
            await refreshRole(nextSession?.user?.id ?? null);
          } catch (innerError) {
            console.error('useAuth.bootstrap recovery getSession error', innerError);
          }
          setAuthError(error instanceof Error ? error.message : 'No se pudo verificar la sesión.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isUsingPlaceholder) return;
      setSession(nextSession);
      setAuthError(null);

      // Important: keep this callback synchronous so GoTrue's lock is released quickly.
      // Running async Supabase calls directly here can keep the auth lock for >5s.
      if (roleRefreshTimer) clearTimeout(roleRefreshTimer);
      roleRefreshTimer = setTimeout(() => {
        if (!mounted) return;
        void refreshRole(nextSession?.user?.id ?? null).catch((e) => {
          console.error('useAuth.onAuthStateChange refreshRole error', e);
          // Mantener sesión; fallback a rol docente.
          setRole('teacher');
          setAuthError(e instanceof Error ? e.message : 'No se pudo resolver el rol del usuario; usando rol docente.');
        });
      }, 0);
    });

    return () => {
      mounted = false;
      if (roleRefreshTimer) clearTimeout(roleRefreshTimer);
      subscription?.unsubscribe();
    };
  }, [refreshRole]);

  const signIn = React.useCallback(async (email: string, password: string): Promise<AppRole> => {
    setAuthError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      throw error;
    }
    const nextSession = data.session ?? null;
    setSession(nextSession);
    const userId = data.user?.id ?? nextSession?.user?.id ?? null;
    const resolvedRole = await refreshRole(userId);
    return resolvedRole;
  }, [refreshRole]);

  const signOut = React.useCallback(async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    if (error) {
      // If there is no active auth session in Supabase, still clear local UI state.
      const isMissingSession = /session|Auth session missing/i.test(error.message ?? '');
      const shouldFallbackLocal = isMissingSession || isInvalidRefreshTokenError(error);
      if (shouldFallbackLocal) {
        await supabase.auth.signOut({ scope: 'local' });
      } else {
        setAuthError(error.message);
        throw error;
      }
    }
    setRole(null);
    setSession(null);
  }, []);

  const isAuthenticated = Boolean(session?.user);
  const isStaff = role === 'staff' || role === 'superuser';
  const isSuperuser = role === 'superuser';

  return {
    session,
    role,
    loading,
    authError,
    setAuthError,
    isAuthenticated,
    isStaff,
    isSuperuser,
    signIn,
    signOut,
    refreshRole
  };
}
