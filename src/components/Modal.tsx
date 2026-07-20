import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Modal({ open, title, children, onClose, size = 'md' }: { open: boolean; title: string; children: ReactNode; onClose: () => void; size?: 'md' | 'lg' | 'xl' }) {
  if (!open) return null;
  const width = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={`max-h-[92vh] w-full ${width} overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4 dark:bg-slate-900">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
