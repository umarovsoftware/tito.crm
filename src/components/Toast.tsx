import { CheckCircle2, X, XCircle, AlertTriangle } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning';
interface ToastItem { id: string; message: string; type: ToastType }
interface ToastContextValue { showToast: (message: string, type?: ToastType) => void }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { id, message, type }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed right-4 top-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
        {items.map((item) => {
          const Icon = item.type === 'success' ? CheckCircle2 : item.type === 'error' ? XCircle : AlertTriangle;
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-xl dark:bg-slate-900">
              <Icon className={item.type === 'success' ? 'text-emerald-500' : item.type === 'error' ? 'text-red-500' : 'text-amber-500'} size={20} />
              <p className="flex-1 text-sm font-medium">{item.message}</p>
              <button onClick={() => setItems((current) => current.filter((toast) => toast.id !== item.id))}><X size={17} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast ToastProvider ichida ishlatilishi kerak');
  return context;
}
