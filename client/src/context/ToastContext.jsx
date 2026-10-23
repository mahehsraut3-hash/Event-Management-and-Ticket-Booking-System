import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container in top-right */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          let bg = 'bg-slate-900 text-white border-slate-700';
          let icon = <Info className="w-5 h-5 text-indigo-400 flex-shrink-0" />;

          if (t.type === 'success') {
            bg = 'bg-white text-slate-900 border-emerald-300 shadow-lg';
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
          } else if (t.type === 'error') {
            bg = 'bg-white text-slate-900 border-rose-300 shadow-lg';
            icon = <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
          } else if (t.type === 'warning') {
            bg = 'bg-white text-slate-900 border-amber-300 shadow-lg';
            icon = <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border transition-all transform duration-300 animate-in slide-in-from-top-2 ${bg}`}
            >
              {icon}
              <div className="flex-1 text-xs font-semibold leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-700 transition -mr-1 -mt-1 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
