import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useAppStore } from '../store/AppStore';
import { formatDate } from '../utils/format';

const pageSize = 15;

const actionTone: Record<string, string> = {
  'Yaratildi': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Yangilandi': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  "O'chirildi": 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

export function ActivityLogPage() {
  const { data } = useAppStore();
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('Barchasi');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => data.activityLogs.filter((item) => {
    const matchesQuery = `${item.foydalanuvchi} ${item.model} ${item.obyekt} ${item.izoh}`.toLowerCase().includes(query.toLowerCase());
    const matchesAction = action === 'Barchasi' || item.amal === action;
    return matchesQuery && matchesAction;
  }), [data.activityLogs, query, action]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader title="Loglar" description="Har bir hodimning qo‘shgan, o‘zgartirgan va o‘chirgan yozuvlari shu yerda kuzatiladi." />
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_220px]">
        <label className="relative self-start"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Hodim, mahsulot yoki izoh bo‘yicha qidirish..." /></label>
        <select className="input" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option>Barchasi</option>
          <option>Yaratildi</option>
          <option>Yangilandi</option>
          <option>O'chirildi</option>
        </select>
      </div>
      <div className="card overflow-hidden">
        {/* Mobile: card list */}
        <div className="divide-y lg:hidden">
          {rows.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{item.foydalanuvchi}</p><p className="text-xs text-slate-500">{formatDate(item.sana)}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionTone[item.amal] ?? 'bg-slate-100 text-slate-600'}`}>{item.amal}</span>
              </div>
              <p className="mt-2 text-sm">{item.model} · {item.obyekt}</p>
              {item.izoh && <p className="mt-1 text-xs text-slate-500">{item.izoh}</p>}
            </div>
          ))}
        </div>
        {/* Desktop: condensed table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="table-head"><tr><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Hodim</th><th className="px-4 py-3">Amal</th><th className="px-4 py-3">Bo‘lim</th><th className="px-4 py-3">Obyekt</th><th className="px-4 py-3">Izoh</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(item.sana)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold">{item.foydalanuvchi}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionTone[item.amal] ?? 'bg-slate-100 text-slate-600'}`}>{item.amal}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.model}</td>
                  <td className="px-4 py-3">{item.obyekt}</td>
                  <td className="px-4 py-3 text-slate-500">{item.izoh || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState text="Hozircha log yozuvlari yo‘q" />}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
    </div>
  );
}
