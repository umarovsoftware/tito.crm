import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-slate-500">{page} / {pages} sahifa</span>
      <div className="flex gap-2">
        <button className="btn-secondary !p-2" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={17} /></button>
        <button className="btn-secondary !p-2" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={17} /></button>
      </div>
    </div>
  );
}
