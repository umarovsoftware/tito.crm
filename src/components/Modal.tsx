import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ open, title, children, onClose, size = 'md' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; size?: 'md' | 'lg' | 'xl' }) {
  if (!open) return null;
  const width = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-sm sm:p-4" onMouseDown={onClose}>
      <div className={`max-h-[calc(100dvh-1rem)] w-full min-w-0 ${width} overflow-y-auto rounded-2xl bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-3xl dark:bg-slate-900`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex min-w-0 items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-5 sm:py-4 dark:bg-slate-900">
          <h2 className="min-w-0 truncate text-base font-bold sm:text-lg">{title}</h2>
          <button className="shrink-0 rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
