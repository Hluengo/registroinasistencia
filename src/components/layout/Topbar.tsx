import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, Menu, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../services/supabaseClient';
import { cn } from '../../utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
  isAuthenticated: boolean;
  roleLabel: string;
  userEmail?: string;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onSearch?: (query: string) => void;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning';
  created_at: string;
  read: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  onMenuClick,
  isAuthenticated,
  roleLabel,
  userEmail,
  onLoginClick,
  onLogoutClick,
  onSearch
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Notification[]>({
    queryKey: ['topbar-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instant_messages')
        .select('id, title, body, is_active, starts_at, created_at')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .or('ends_at.is.null,ends_at.gte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.warn('Failed to load notifications:', error);
        return [];
      }
      
      return (data || []).map(m => ({
        id: m.id,
        title: m.title,
        body: m.body || '',
        type: 'info' as const,
        created_at: m.created_at,
        read: false
      }));
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    staleTime: 15000
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      const searchEvent = new CustomEvent('global-search', { detail: { query: searchQuery } });
      window.dispatchEvent(searchEvent);
    }
  }, [searchQuery, onSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const markAsRead = (id: string) => {
    supabase.from('instant_messages').update({ is_active: false }).eq('id', id).then();
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: es });
    } catch {
      return 'recientemente';
    }
  };

  const unreadCount = messages.filter(n => !n.read).length;

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 md:px-10 sticky top-0 z-20">
      <div className="flex items-center gap-5">
        <button 
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all duration-200 active:scale-95"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate max-w-[200px] md:max-w-none">{title}</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-8">
        <div className="relative hidden lg:block group">
          <Search className={cn(
            "w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
            isSearchFocused ? "text-indigo-600" : "text-slate-400"
          )} strokeWidth={2} />
          <input 
            ref={searchRef}
            type="text" 
            placeholder="Buscar estudiantes, inasistencias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            onKeyDown={handleKeyDown}
            className="pl-11 pr-5 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white w-64 xl:w-80 transition-all duration-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationRef}>
            <button 
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "p-2.5 rounded-2xl transition-all duration-200 relative active:scale-95",
                showNotifications ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              )}
            >
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200/60 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden z-50">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <h3 className="font-bold text-slate-900 text-sm">Notificaciones</h3>
                    {loadingMessages && (
                      <span className="text-[10px] text-slate-400">Cargando...</span>
                    )}
                  </div>
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
                    {messages.length === 0 ? (
                      <div className="p-10 text-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-slate-300" strokeWidth={1} />
                        </div>
                        <p className="text-sm font-medium text-slate-400">Sin notificaciones</p>
                      </div>
                    ) : (
                      messages.map((n) => (
                        <button 
                          type="button"
                          key={n.id} 
                          className={cn(
                            "w-full text-left p-5 hover:bg-slate-50/80 transition-colors cursor-pointer relative group",
                            !n.read && "bg-indigo-50/20"
                          )}
                          onClick={() => markAsRead(n.id)}
                        >
                          <div className="flex gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                              n.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                              n.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100/50' :
                              'bg-indigo-50 text-indigo-600 border-indigo-100/50'
                            )}>
                              {n.type === 'success' ? <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} /> :
                               n.type === 'warning' ? <AlertCircle className="w-5 h-5" strokeWidth={1.5} /> :
                               <Info className="w-5 h-5" strokeWidth={1.5} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className={cn("text-sm font-bold truncate tracking-tight", !n.read ? 'text-slate-900' : 'text-slate-600')}>
                                  {n.title}
                                </p>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{formatTime(n.created_at)}</span>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium">
                                {n.body}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-200/60 mx-1 hidden sm:block"></div>

          <div className="flex items-center gap-3 pl-1">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900 leading-none mb-1">{isAuthenticated ? (userEmail || 'Usuario') : 'Invitado'}</p>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none">{roleLabel}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm">
              {(userEmail?.[0] || 'G').toUpperCase()}
            </div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={onLogoutClick}
                className="hidden md:block px-3 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Salir
              </button>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="hidden md:block px-3 py-2 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Ingresar Staff
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
