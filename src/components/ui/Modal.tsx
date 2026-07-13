import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  testId?: string;
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', testId }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
    return () => dialog.close();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <dialog
        ref={dialogRef}
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]} relative z-10 overflow-hidden flex flex-col max-h-[90vh]`}
        aria-labelledby={testId ? `${testId}-title` : undefined}
        data-testid={testId ? `${testId}-dialog` : undefined}
      >
        <form method="dialog" className="w-full h-full flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 id={testId ? `${testId}-title` : undefined} className="text-lg font-bold text-slate-800">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </form>
      </dialog>
    </>
  );
};
