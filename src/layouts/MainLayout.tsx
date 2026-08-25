import React from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { LayoutProvider } from '../contexts/LayoutContext'

interface MainLayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  level: 'BASICA' | 'MEDIA'
  setLevel: (level: 'BASICA' | 'MEDIA') => void
  title: string
  role: 'public' | 'staff' | 'superuser'
  roleLabel: string
  userEmail?: string
  onLoginClick: () => void
  onLogoutClick: () => void
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  level,
  setLevel,
  title,
  role,
  roleLabel,
  userEmail,
  onLoginClick,
  onLogoutClick,
}) => {
  return (
    <LayoutProvider
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isSidebarOpen={isSidebarOpen}
      openSidebar={() => setIsSidebarOpen(true)}
      closeSidebar={() => setIsSidebarOpen(false)}
      level={level}
      setLevel={setLevel}
      title={title}
      role={role}
      roleLabel={roleLabel}
      userEmail={userEmail}
      onLoginClick={onLoginClick}
      onLogoutClick={onLogoutClick}
    >
      <div className="min-h-screen bg-slate-50 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 lg:ml-72 min-h-screen flex flex-col relative overflow-y-auto">
          <Topbar />
          <div className="flex-1 p-6 md:p-10 lg:p-12">
            <div className="max-w-screen-2xl mx-auto space-y-10">
              {children}
            </div>
          </div>
          <footer className="px-6 md:px-10 lg:px-12 py-10 border-t border-slate-200/60 bg-white/50 backdrop-blur-sm text-center">
            <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-[0.2em]">
              © 2026 Sistema de Gestión de Convivencia Escolar • Registro
              Institucional • Versión 1.0.0
            </p>
          </footer>
        </main>
      </div>
    </LayoutProvider>
  )
}
