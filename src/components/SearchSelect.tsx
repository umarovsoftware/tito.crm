import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface SearchSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  disabled?: boolean;
}

export function SearchSelect({ value, onChange, options, placeholder = 'Tanlang' }: { value: string; onChange: (value: string) => void; options: SearchSelectOption[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) => `${option.label} ${option.sublabel ?? ''}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    setQuery('');
    inputRef.current?.focus();
    const onMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const select = (option: SearchSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" className="input flex w-full items-center justify-between gap-2 text-left" onClick={() => setOpen((current) => !current)}>
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="relative border-b p-2">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input ref={inputRef} className="input h-9 pl-8 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Qidirish..." />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-400">Natija topilmadi</p>}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => select(option)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${option.disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-slate-100 dark:hover:bg-slate-800'} ${option.value === value ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
              >
                <span className="min-w-0 truncate">{option.label}{option.sublabel ? <span className="ml-2 text-xs text-slate-400">{option.sublabel}</span> : null}</span>
                {option.value === value && <Check size={15} className="shrink-0 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
