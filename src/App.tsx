import React from 'react';
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
    membershipStatus,
    membershipAuthMode,
    membershipLoaded,
    membershipLoading,
    membershipError,
    legacyFallbackUsed,
    membershipHasAccess,
  } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

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

  const getTitle = () => {
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
    ? 'Docente público'
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
          type: TOAST_TYPES.INFO,
          message: 'Sesión iniciada con rol docente. Se habilita solo la vista docente.',
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

  if (session?.user && !membershipLoaded && membershipMode !== 'legacy') {
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

  if (session?.user && membershipLoaded && !membershipHasAccess) {
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
        onLoginClick={() => {
          setAuthError(null);
          patchAuthUiState({ isLoginOpen: true });
        }}
        onLogoutClick={handleLogout}
      >
        <ErrorBoundary>
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
        </ErrorBoundary>
      </MainLayout>
      <Modal
        isOpen={isLoginOpen}
        onClose={() => patchAuthUiState({ isLoginOpen: false })}
        title="Ingreso Staff"
        size="sm"
      >
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Correo"
            type="email"
            value={email}
            onChange={(e) => patchAuthUiState({ email: e.target.value })}
            placeholder="staff@colegio.cl"
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => patchAuthUiState({ password: e.target.value })}
            placeholder="••••••••"
            required
          />
          {authError ? <p className="text-sm text-rose-600">{authError}</p> : null}
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
      </Modal>
      <ToastContainer />
    </>
  );
}

export default AppContent;
