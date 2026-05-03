import React, { createContext, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';

const ToastContext = createContext(null);

const ICONS = {
  success: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const STYLES = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
  error:   'bg-red-500/15    border-red-500/30    text-red-300',
  warning: 'bg-amber-500/15  border-amber-500/30  text-amber-300',
  info:    'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
};

function ToastItem({ id, message, type, onDismiss }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm text-sm font-medium shadow-glass animate-slide-up max-w-sm ${STYLES[type]}`}
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(13,13,20,0.85)' }}
    >
      <span className={STYLES[type]}>{ICONS[type]}</span>
      <span className="flex-1 text-slate-200">{message}</span>
      <button onClick={() => onDismiss(id)} className="text-slate-500 hover:text-slate-300 transition-colors ml-1 flex-shrink-0">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const toastRoot = document.getElementById('toast-root');

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toastRoot && ReactDOM.createPortal(
        toasts.map(t => <ToastItem key={t.id} {...t} onDismiss={dismiss} />),
        toastRoot
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.toast;
};
