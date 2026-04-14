import React, { createContext, useContext, useCallback, useState } from 'react';
import { TOAST_TYPES, type ToastType } from '../constants';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { ...toast, id, duration: toast.duration ?? 4000 };
    
    setToasts(prev => [...prev, newToast]);

    return id;
  }, []);

  const showSuccess = useCallback((message: string, duration?: number) => {
    return showToast({ type: TOAST_TYPES.SUCCESS, message, duration });
  }, [showToast]);

  const showError = useCallback((message: string, duration?: number) => {
    return showToast({ type: TOAST_TYPES.ERROR, message, duration: duration ?? 6000 });
  }, [showToast]);

  const showWarning = useCallback((message: string, duration?: number) => {
    return showToast({ type: TOAST_TYPES.WARNING, message, duration });
  }, [showToast]);

  const showInfo = useCallback((message: string, duration?: number) => {
    return showToast({ type: TOAST_TYPES.INFO, message, duration });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ 
      showToast, 
      showSuccess, 
      showError, 
      showWarning, 
      showInfo, 
      removeToast, 
      toasts 
    }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe estar dentro de <ToastProvider>');
  }
  return context;
};

export const useToastHelpers = () => {
  const { showSuccess, showError, showWarning, showInfo, removeToast } = useToast();
  
  const handleServiceError = (error: unknown, fallbackMsg = 'Error inesperado') => {
    const msg = error instanceof Error ? error.message : fallbackMsg;
    showError(msg);
  };
  
  const handleServiceSuccess = (message: string) => {
    showSuccess(message);
  };
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    handleServiceError,
    handleServiceSuccess
  };
};
