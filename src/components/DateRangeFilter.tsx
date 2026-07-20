import type { DateRange, DatePreset } from '../types';
import { getPresetRange } from '../utils/date';

export function DateRangeFilter({ value, onChange }: { value: DateRange; onChange: (value: DateRange) => void }) {
  const setPreset = (preset: DatePreset) => {
    if (preset === 'custom') return onChange({ ...value, preset });
    const range = getPresetRange(preset);
    onChange({ preset, ...range });
  };
  return (
    <div className="card flex flex-wrap items-center gap-2 p-2">
      {([['today', 'Bugun'], ['week', 'Hafta'], ['month', 'Oy'], ['custom', 'Sana oralig‘i']] as Array<[DatePreset, string]>).map(([key, label]) => (
        <button key={key} onClick={() => setPreset(key)} className={`rounded-xl px-3 py-2 text-sm font-medium ${value.preset === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{label}</button>
      ))}
      {value.preset === 'custom' && <><input className="input w-auto" type="date" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })} /><span className="text-slate-400">—</span><input className="input w-auto" type="date" value={value.end} onChange={(e) => onChange({ ...value, end: e.target.value })} /></>}
    </div>
  );
}
