import React from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabaseClient'
import type {
  MembershipStatus,
  MembershipAuthMode,
  AppMembership,
} from '../types/membership'
import {
  getMyMembership,
  getMembershipMode,
  invalidateMembershipCache,
} from '../services/membershipService'

type AppRole = 'teacher' | 'staff' | 'superuser' | null
const GET_SESSION_TIMEOUT_MS = 20000
const ROLE_TIMEOUT_MS = 12000
const INVALID_REFRESH_TOKEN_RE =
  /(invalid refresh token|refresh token not found|invalid_grant)/i

const TIMEOUT = Symbol('timeout')

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | typeof TIMEOUT> {
  return Promise.race([
    promise,
    new Promise<typeof TIMEOUT>((resolve) =>
      setTimeout(() => resolve(TIMEOUT), ms)
    ),
  ])
}

async function getSessionWithRetry() {
  const first = await withTimeout(
    supabase.auth.getSession(),
    GET_SESSION_TIMEOUT_MS
  )
  if (first !== TIMEOUT) return first
  console.warn('useAuth.bootstrap: getSession timeout (1), retrying once...')
  return withTimeout(supabase.auth.getSession(), GET_SESSION_TIMEOUT_MS)
}

function isInvalidRefreshTokenError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return INVALID_REFRESH_TOKEN_RE.test(message)
}

type AuthBootstrapOptions = {
  loadMembership: (userId: string | null) => Promise<void>
  mountedRef: React.MutableRefObject<boolean>
  refreshRole: (userId?: string | null) => Promise<AppRole>
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setRole: React.Dispatch<React.SetStateAction<AppRole>>
  setSession: React.Dispatch<React.SetStateAction<Session | null>>
}

async function runAuthBootstrap({
  loadMembership,
  mountedRef,
  refreshRole,
  setAuthError,
  setLoading,
  setRole,
  setSession,
}: AuthBootstrapOptions) {
  setLoading(true)

  try {
    const sessionRes = await getSessionWithRetry()
    if (!mountedRef.current) return
    if (sessionRes === TIMEOUT) {
      console.warn('useAuth.bootstrap: getSession timeout')
      setAuthError('Tiempo de espera agotado al verificar sesión.')
      setSession(null)
      setRole(null)
      return
    }
    const { data, error } = sessionRes
    if (error && isInvalidRefreshTokenError(error)) {
      console.warn(
        'useAuth.bootstrap: invalid refresh token detected; clearing local session'
      )
      await supabase.auth.signOut({ scope: 'local' })
      if (!mountedRef.current) return
      setSession(null)
      setRole(null)
      setAuthError(null)
      return
    }
    if (error) throw error
    if (!mountedRef.current) return
    const nextSession = data.session ?? null
    setSession(nextSession)
    setAuthError(null)
    await refreshRole(nextSession?.user?.id ?? null)
    if (!mountedRef.current) return
    await loadMembership(nextSession?.user?.id ?? null)
  } catch (error) {
    console.error('useAuth.bootstrap error', error)
    if (mountedRef.current) {
      if (isInvalidRefreshTokenError(error)) {
        console.warn(
          'useAuth.bootstrap: invalid refresh token during recovery; clearing local session'
        )
        await supabase.auth.signOut({ scope: 'local' })
        if (!mountedRef.current) return
        setSession(null)
        setRole(null)
        setAuthError(null)
        return
      }
      try {
        const { data } = await supabase.auth.getSession()
        if (!mountedRef.current) return
        const nextSession = data.session ?? null
        setSession(nextSession)
        await refreshRole(nextSession?.user?.id ?? null)
        if (!mountedRef.current) return
      } catch (innerError) {
        console.error('useAuth.bootstrap recovery getSession error', innerError)
      }
      setAuthError(
        error instanceof Error
          ? error.message
          : 'No se pudo verificar la sesión.'
      )
    }
  } finally {
    if (mountedRef.current) setLoading(false)
  }
}

export function useAuth() {
  const [session, setSession] = React.useState<Session | null>(null)
  const [role, setRole] = React.useState<AppRole>(null)
  const [tenantId, setTenantId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [authError, setAuthError] = React.useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = React.useState(false)
  const [membershipStatus, setMembershipStatus] =
    React.useState<MembershipStatus>('not_available')
  const [membershipAuthMode, setMembershipAuthMode] =
    React.useState<MembershipAuthMode>('legacy')
  const [membership, setMembershipState] = React.useState<AppMembership | null>(
    null
  )
  const [membershipLoaded, setMembershipLoaded] = React.useState(false)
  const [membershipLoading, setMembershipLoading] = React.useState(false)
  const [membershipError, setMembershipError] = React.useState<string | null>(
    null
  )
  const [legacyFallbackUsed, setLegacyFallbackUsed] = React.useState(false)
  const mountedRef = React.useRef(true)
  const roleRefreshTimerRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null)
  const membershipFetchedRef = React.useRef(false)
  const lastUserIdRef = React.useRef<string | null>(null)

  const normalizeRole = React.useCallback((value: unknown): AppRole => {
    if (value === 'staff' || value === 'superuser' || value === 'teacher')
      return value
    return null
  }, [])

  const refreshRole = React.useCallback(
    async (userId?: string | null): Promise<AppRole> => {
      if (!userId) {
        setRole(null)
        setTenantId(null)
        return null
      }

      try {
        const profileRes = await withTimeout(
          Promise.resolve(
            supabase
              .from('profiles')
              .select('role, tenant_id')
              .eq('user_id', userId)
              .maybeSingle()
          ),
          ROLE_TIMEOUT_MS
        )

        if (profileRes !== TIMEOUT) {
          const { data, error } = profileRes
          if (!error && data) {
            const fromProfile = normalizeRole(data.role)
            if (fromProfile) setRole(fromProfile)
            setTenantId(data.tenant_id ?? null)
            if (fromProfile) return fromProfile
          }

          if (error) {
            console.error('useAuth.refreshRole profiles error', error)
          }
        } else {
          console.warn('useAuth.refreshRole profiles timeout')
        }

        const rpcRes = await withTimeout(
          Promise.resolve(supabase.rpc('current_role')),
          ROLE_TIMEOUT_MS
        )
        if (rpcRes !== TIMEOUT) {
          const { data: rpcRole, error: rpcErr } = rpcRes
          const fromRpc = normalizeRole(rpcRole)
          if (!rpcErr && fromRpc) {
            setRole(fromRpc)
            return fromRpc
          }

          if (rpcErr) {
            console.error('useAuth.refreshRole rpc current_role error', rpcErr)
          }
        } else {
          console.warn('useAuth.refreshRole current_role timeout')
        }
      } catch (err) {
        console.error('useAuth.refreshRole unexpected error', err)
      }

      setRole('teacher')
      return 'teacher'
    },
    [normalizeRole]
  )

  const loadMembership = React.useCallback(async (userId: string | null) => {
    const mode = getMembershipMode()
    setMembershipAuthMode(mode)

    if (mode === 'legacy') {
      setLegacyFallbackUsed(true)
      setMembershipLoaded(true)
      return
    }

    if (!userId) {
      setMembershipStatus('not_available')
      setMembershipLoaded(true)
      return
    }

    if (lastUserIdRef.current !== userId) {
      membershipFetchedRef.current = false
      invalidateMembershipCache()
    }

    if (membershipFetchedRef.current) return
    membershipFetchedRef.current = true
    lastUserIdRef.current = userId

    setMembershipLoading(true)

    try {
      const result = await getMyMembership('inasistencias')
      setMembershipStatus(result.status)
      setMembershipState(
        result.memberships.find(
          (m) => m.application_code === 'inasistencias'
        ) ?? null
      )
      setMembershipError(
        result.status === 'error' ? 'Error al cargar membresía' : null
      )
      setMembershipLoaded(true)

      if (result.status === 'no_membership' && mode === 'transition') {
        setLegacyFallbackUsed(true)
      }
    } catch {
      setMembershipError('Error al verificar membresía')
    } finally {
      setMembershipLoading(false)
    }
  }, [])

  React.useEffect(() => {
    mountedRef.current = true
    void runAuthBootstrap({
      loadMembership,
      mountedRef,
      refreshRole,
      setAuthError,
      setLoading,
      setRole,
      setSession,
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mountedRef.current) return
      setSession(nextSession)
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }

      if (roleRefreshTimerRef.current) clearTimeout(roleRefreshTimerRef.current)
      roleRefreshTimerRef.current = setTimeout(() => {
        if (!mountedRef.current) return
        void refreshRole(nextSession?.user?.id ?? null).catch((e) => {
          console.error('useAuth.onAuthStateChange refreshRole error', e)
          setRole('teacher')
          setAuthError(
            e instanceof Error
              ? e.message
              : 'No se pudo resolver el rol del usuario; usando rol docente.'
          )
        })
      }, 0)
    })

    return () => {
      mountedRef.current = false
      if (roleRefreshTimerRef.current) clearTimeout(roleRefreshTimerRef.current)
      subscription?.unsubscribe()
    }
  }, [refreshRole, loadMembership])

  const signIn = React.useCallback(
    async (email: string, password: string): Promise<AppRole> => {
      setAuthError(null)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setAuthError(error.message)
        throw error
      }
      const nextSession = data.session ?? null
      setSession(nextSession)
      const userId = data.user?.id ?? nextSession?.user?.id ?? null
      const resolvedRole = await refreshRole(userId)
      await loadMembership(userId)
      return resolvedRole
    },
    [refreshRole, loadMembership]
  )

  const requestPasswordReset = React.useCallback(async (email: string) => {
    setAuthError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) {
      setAuthError(error.message)
      throw error
    }
  }, [])

  const updatePassword = React.useCallback(async (password: string) => {
    setAuthError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setAuthError(error.message)
      throw error
    }
    setIsPasswordRecovery(false)
    await supabase.auth.signOut({ scope: 'global' })
    setSession(null)
    setRole(null)
  }, [])

  const signOut = React.useCallback(async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    if (error) {
      const isMissingSession = /session|Auth session missing/i.test(
        error.message ?? ''
      )
      const shouldFallbackLocal =
        isMissingSession || isInvalidRefreshTokenError(error)
      if (shouldFallbackLocal) {
        await supabase.auth.signOut({ scope: 'local' })
      } else {
        setAuthError(error.message)
        throw error
      }
    }
    setRole(null)
    setSession(null)
    setMembershipStatus('not_available')
    setMembershipState(null)
    setMembershipLoaded(false)
    setLegacyFallbackUsed(false)
    membershipFetchedRef.current = false
    lastUserIdRef.current = null
  }, [])

  const isAuthenticated = Boolean(session?.user)
  const isStaff = role === 'staff' || role === 'superuser'
  const isSuperuser = role === 'superuser'

  const membershipHasAccess =
    membershipAuthMode === 'legacy' ||
    membershipStatus === 'active' ||
    (membershipAuthMode === 'transition' &&
      legacyFallbackUsed &&
      membershipStatus !== 'inactive')

  return {
    session,
    role,
    appRole: role,
    tenantId,
    loading,
    authError,
    setAuthError,
    isPasswordRecovery,
    requestPasswordReset,
    updatePassword,
    isAuthenticated,
    isStaff,
    isSuperuser,
    membershipStatus,
    membershipAuthMode,
    membership,
    membershipLoaded,
    membershipLoading,
    membershipError,
    legacyFallbackUsed,
    membershipHasAccess,
    signIn,
    signOut,
    refreshRole,
  }
}
