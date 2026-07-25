import React, { createContext, useContext } from 'react'

type AppRole = 'public' | 'staff' | 'superuser'

interface LayoutContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
  isSidebarOpen: boolean
  openSidebar: () => void
  closeSidebar: () => void
  level: 'BASICA' | 'MEDIA'
  setLevel: (level: 'BASICA' | 'MEDIA') => void
  title: string
  role: AppRole
  roleLabel: string
  userEmail: string | undefined
  onLoginClick: () => void
  onLogoutClick: () => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function useLayoutContext(): LayoutContextValue {
  const ctx = useContext(LayoutContext)
  if (!ctx) {
    throw new Error('useLayoutContext must be used within LayoutProvider')
  }
  return ctx
}

interface LayoutProviderProps extends LayoutContextValue {
  children: React.ReactNode
}

export function LayoutProvider({
  children,
  ...value
}: LayoutProviderProps) {
  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  )
}
