import React from 'react';
import { BookOpen, CheckCircle2, LogIn, MessageSquareText, ShieldCheck, TableProperties } from 'lucide-react';
import { MainLayout } from './layouts/MainLayout';
import { ToastContainer } from './components/ToastContainer';
import { Modal } from './components/ui/Modal';
import { Input } from './components/ui/Input';
import { Button } from './components/ui/Button';
import { useAuth } from './hooks/useAuth';
import { useToast } from './contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { TOAST_TYPES } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getMembershipMode } from './services/membershipService';

const Dashboard = React.lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const DocentePublico = React.lazy(() =>
  import('./pages/DocentePublico').then((m) => ({ default: m.DocentePublico }))
);
const Inasistencias = React.lazy(() =>
  import('./pages/Inasistencias').then((m) => ({ default: m.Inasistencias }))
);
const Pruebas = React.lazy(() => import('./pages/Pruebas').then((m) => ({ default: m.Pruebas })));
const Inspectoria = React.lazy(() =>
  import('./pages/Inspectoria').then((m) => ({ default: m.Inspectoria }))
);
const Estudiantes = React.lazy(() =>
  import('./pages/Estudiantes').then((m) => ({ default: m.Estudiantes }))
);
const Configuracion = React.lazy(() =>
  import('./pages/Configuracion').then((m) => ({ default: m.Configuracion }))
);

function WelcomeGate({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-8">
      <section className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 px-7 py-9 text-white md:px-12 md:py-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-200">
              Acceso exclusivo para docentes
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Bienvenido al Registro Escolar
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-indigo-100 md:text-base">
              Esta plataforma reúne los mensajes institucionales, las inasistencias justificadas o
              pendientes y las evaluaciones afectadas, para facilitar la información oportuna al
              equipo docente.
            </p>
          </div>
        </div>

        <div className="px-7 py-8 md:px-12 md:py-10">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <MessageSquareText className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-3 text-sm font-bold text-slate-900">Revisa los mensajes</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Consulta avisos generales, por nivel y por curso.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <TableProperties className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-3 text-sm font-bold text-slate-900">Consulta la tabla</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Visualiza estudiantes, fechas, estados y pruebas afectadas.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
              <h2 className="mt-3 text-sm font-bold text-slate-900">Acceso protegido</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                La información completa se muestra solo después de iniciar sesión.
              </p>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
              <div>
                <p className="text-sm font-bold text-slate-900">¿Cómo ingresar?</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Presiona el botón de acceso e ingresa el correo y la contraseña institucional que
                  fueron proporcionados al equipo docente.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-center">
            <Button type="button" icon={LogIn} onClick={onLogin}>
              Ingresar a la Vista Docente
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            No compartas las credenciales fuera del establecimiento.
          </p>
        </div>
      </section>
    </div>
  );
}

const AppContentInner = React.memo(function AppContentInner({
  activeTab,
  isStaff,
  isSuperuser,
  level,
  isAuthenticated,
}: {
  activeTab: string;
  isStaff: boolean;
  isSuperuser: boolean;
  level: 'BASICA' | 'MEDIA';
  isAuthenticated: boolean;
}) {
  switch (true) {
    case !isStaff || activeTab === 'docente_public':
      return <DocentePublico level={level} isStaff={isStaff} isAuthenticated={isAuthenticated} />;
    case activeTab === 'dashboard':
      return <Dashboard level={level} />;
    case activeTab === 'inasistencias':
      return <Inasistencias level={level} />;
    case activeTab === 'pruebas':
      return <Pruebas level={level} />;
    case activeTab === 'inspectoria':
      return <Inspectoria level={level} />;
    case activeTab === 'estudiantes':
      return <Estudiantes level={level} />;
    case activeTab === 'configuracion':
      return isSuperuser ? <Configuracion /> : <Dashboard level={level} />;
    default:
      return <Dashboard level={level} />;
  }
});

function AppContent() {
  const [uiState, patchUiState] = React.useReducer(
    (
      state: {
        activeTab: string;
        isSidebarOpen: boolean;
        level: 'BASICA' | 'MEDIA';
      },
      patch: Partial<{
        activeTab: string;
        isSidebarOpen: boolean;
        level: 'BASICA' | 'MEDIA';
      }>
    ) => ({ ...state, ...patch }),
    { activeTab: 'dashboard', isSidebarOpen: false, level: 'BASICA' }
  );
  const [authUiState, patchAuthUiState] = React.useReducer(
    (
      state: {
        isLoginOpen: boolean;
        email: string;
        password: string;
        loginLoading: boolean;
      },
      patch: Partial<{
        isLoginOpen: boolean;
        email: string;
        password: string;
        loginLoading: boolean;
      }>
    ) => ({ ...state, ...patch }),
    { isLoginOpen: false, email: '', password: '', loginLoading: false }
  );
  const { activeTab, isSidebarOpen, level } = uiState;
  const { isLoginOpen, email, password, loginLoading } = authUiState;
  const [authMode, setAuthMode] = React.useState<'login' | 'request-reset' | 'update-password'>(
    'login'
  );
  const [passwordConfirmation, setPasswordConfirmation] = React.useState('');
  const {
    session,
    role,
    loading,
    isStaff,
    isSuperuser,
    isAuthenticated,
    signIn,
    signOut,
    authError,
    setAuthError,
    isPasswordRecovery,
    requestPasswordReset,
    updatePassword,
    membershipLoaded,
    membershipError,
    legacyFallbackUsed,
    membershipHasAccess,
  } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (isPasswordRecovery) {
      setAuthMode('update-password');
      patchAuthUiState({ isLoginOpen: true, password: '' });
      setPasswordConfirmation('');
    }
  }, [isPasswordRecovery]);

  React.useEffect(() => {
    if (loading) return;

    let nextActiveTab = activeTab;
    if (!isStaff) {
      nextActiveTab = 'docente_public';
    } else if (!isSuperuser && activeTab === 'configuracion') {
      nextActiveTab = 'dashboard';
    }

    if (nextActiveTab !== activeTab) {
      patchUiState({ activeTab: nextActiveTab });
    }
  }, [loading, isStaff, isSuperuser, activeTab]);

  const openLogin = () => {
    setAuthError(null);
    setAuthMode('login');
    setPasswordConfirmation('');
    patchAuthUiState({ isLoginOpen: true, password: '' });
  };

  const getTitle = () => {
    if (!isAuthenticated) return 'Bienvenida';
    if (!isStaff || activeTab === 'docente_public') return 'Vista Docente';
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Docente';
      case 'inasistencias':
        return 'Gestión de Inasistencias';
      case 'pruebas':
        return 'Registro de Evaluaciones';
      case 'inspectoria':
        return 'Atención de Inspectoría';
      case 'estudiantes':
        return 'Fichas de Estudiantes';
      case 'configuracion':
        return 'Configuración';
      default:
        return 'Dashboard';
    }
  };

  const roleLabel = !isAuthenticated
    ? 'Acceso restringido'
    : role === 'superuser'
      ? 'Superusuario'
      : role === 'staff'
        ? 'Staff'
        : 'Docente';
  const sidebarRole = !isAuthenticated
    ? ('public' as const)
    : isSuperuser
      ? ('superuser' as const)
      : ('staff' as const);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      patchAuthUiState({ loginLoading: true });
      const signedRole = await signIn(email.trim(), password);
      patchAuthUiState({ isLoginOpen: false, email: '', password: '' });
      if (signedRole === 'staff' || signedRole === 'superuser') {
        patchUiState({ activeTab: 'dashboard' });
        showToast({
          type: TOAST_TYPES.SUCCESS,
          message: `Sesión iniciada como ${signedRole === 'superuser' ? 'superusuario' : 'staff'}.`,
        });
      } else {
        patchUiState({ activeTab: 'docente_public' });
        showToast({
          type: TOAST_TYPES.SUCCESS,
          message: 'Bienvenido. Se habilitó la Vista Docente con información completa.',
        });
      }
    } catch (error) {
      console.error('Login error', error);
      showToast({
        type: TOAST_TYPES.ERROR,
        message: 'No se pudo iniciar sesión. Verifica tus credenciales.',
      });
    } finally {
      patchAuthUiState({ loginLoading: false });
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setAuthError('Ingrese su correo electrónico.');
      return;
    }
    try {
      patchAuthUiState({ loginLoading: true });
      await requestPasswordReset(email.trim());
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: 'Si la cuenta existe, recibirá un enlace para crear una contraseña nueva.',
      });
    } catch (error) {
      console.error('Password reset request error', error);
      showToast({
        type: TOAST_TYPES.ERROR,
        message: 'No se pudo enviar el enlace de recuperación.',
      });
    } finally {
      patchAuthUiState({ loginLoading: false });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setAuthError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirmation) {
      setAuthError('Las contraseñas no coinciden.');
      return;
    }
    try {
      patchAuthUiState({ loginLoading: true });
      await updatePassword(password);
      setAuthMode('login');
      setPasswordConfirmation('');
      patchAuthUiState({ password: '', isLoginOpen: true });
      showToast({
        type: TOAST_TYPES.SUCCESS,
        message: 'Contraseña actualizada. Ya puede iniciar sesión.',
      });
    } catch (error) {
      console.error('Password update error', error);
      showToast({
        type: TOAST_TYPES.ERROR,
        message: 'No se pudo actualizar la contraseña.',
      });
    } finally {
      patchAuthUiState({ loginLoading: false });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      queryClient.clear();
      patchUiState({ activeTab: 'docente_public' });
      showToast({ type: TOAST_TYPES.SUCCESS, message: 'Sesión cerrada.' });
    } catch (error) {
      console.error('Logout error', error);
      showToast({
        type: TOAST_TYPES.ERROR,
        message: 'No se pudo cerrar sesión.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm font-medium text-slate-500">Cargando sesión...</p>
      </div>
    );
  }

  const membershipMode = getMembershipMode();

  if (session?.user && !isPasswordRecovery && !membershipLoaded && membershipMode !== 'legacy') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">Verificando membresía...</p>
          {membershipMode === 'transition' && legacyFallbackUsed && (
            <p className="text-xs text-amber-600">
              Modo transición — usando credenciales heredadas como respaldo.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (session?.user && !isPasswordRecovery && membershipLoaded && !membershipHasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-rose-600 text-sm font-medium">No tiene acceso a esta aplicación</div>
          <p className="text-slate-600 text-sm">
            {membershipError ?? 'Su cuenta no tiene una membresía activa para esta aplicación.'}
          </p>
          {membershipMode === 'enforced' && (
            <p className="text-amber-600 text-xs">
              Modo restringido — solo usuarios con membresía activa pueden acceder.
            </p>
          )}
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Reintentar
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainLayout
        activeTab={activeTab}
        setActiveTab={(tab) => patchUiState({ activeTab: tab })}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={(isOpen) => patchUiState({ isSidebarOpen: isOpen })}
        level={level}
        setLevel={(nextLevel) => patchUiState({ level: nextLevel })}
        title={getTitle()}
        role={sidebarRole}
        roleLabel={roleLabel}
        userEmail={session?.user?.email}
        onLoginClick={openLogin}
        onLogoutClick={handleLogout}
      >
        <ErrorBoundary>
          {!isAuthenticated ? (
            <WelcomeGate onLogin={openLogin} />
          ) : (
            <React.Suspense
              fallback={<div className="text-sm font-medium text-slate-500">Cargando módulo...</div>}
            >
              <AppContentInner
                activeTab={activeTab}
                isStaff={isStaff}
                isSuperuser={isSuperuser}
                level={level}
                isAuthenticated={isAuthenticated}
              />
            </React.Suspense>
          )}
        </ErrorBoundary>
      </MainLayout>
      <Modal
        isOpen={isLoginOpen}
        onClose={() => {
          if (authMode !== 'update-password') {
            patchAuthUiState({ isLoginOpen: false });
          }
        }}
        title={
          authMode === 'login'
            ? 'Acceso docente y staff'
            : authMode === 'request-reset'
              ? 'Recuperar contraseña'
              : 'Crear nueva contraseña'
        }
        size="sm"
      >
        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Ingresa el correo y la contraseña institucional proporcionados por el establecimiento.
            </p>
            <Input
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => patchAuthUiState({ email: e.target.value })}
              placeholder="correo@colegio.cl"
              autoComplete="username"
              required
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => patchAuthUiState({ password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
            <button
              type="button"
              onClick={() => {
                setAuthError(null);
                setAuthMode('request-reset');
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              ¿Olvidaste tu contraseña?
            </button>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => patchAuthUiState({ isLoginOpen: false })}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={loginLoading}>
                Ingresar
              </Button>
            </div>
          </form>
        ) : authMode === 'request-reset' ? (
          <form onSubmit={handleResetRequest} className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Ingresa tu correo. Te enviaremos un enlace seguro para crear una contraseña nueva.
            </p>
            <Input
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => patchAuthUiState({ email: e.target.value })}
              placeholder="correo@colegio.cl"
              autoComplete="email"
              required
            />
            {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setAuthError(null);
                  setAuthMode('login');
                }}
              >
                Volver
              </Button>
              <Button type="submit" loading={loginLoading}>
                Enviar enlace
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Ingresa y confirma tu nueva contraseña.
            </p>
            <Input
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => patchAuthUiState({ password: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={6}
              required
            />
            {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
            <div className="flex justify-end pt-2">
              <Button type="submit" loading={loginLoading}>
                Guardar contraseña
              </Button>
            </div>
          </form>
        )}
      </Modal>
      <ToastContainer />
    </>
  );
}

export default AppContent;
