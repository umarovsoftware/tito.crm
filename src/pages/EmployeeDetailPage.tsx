import { ArrowLeft, History, ListChecks, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate, useParams } from 'react-router-dom';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { EmptyState } from '../components/EmptyState';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useAppStore } from '../store/AppStore';
import type { DateRange } from '../types';
import { daysAgo, getPresetRange, isInRange } from '../utils/date';
import { formatDate } from '../utils/format';

const pageSize = 10;
const actionTone: Record<string, string> = {
  'Yaratildi': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  'Yangilandi': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  "O'chirildi": 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
};

export function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useAppStore();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [range, setRange] = useState<DateRange>({ preset: 'month', ...getPresetRange('month') });

  const employee = data.employees.find((item) => item.id === Number(id));
  const logs = useMemo(() => data.activityLogs.filter((item) => item.foydalanuvchiId === Number(id)).sort((a, b) => b.sana.localeCompare(a.sana)), [data.activityLogs, id]);

  const created = logs.filter((item) => item.amal === 'Yaratildi').length;
  const updated = logs.filter((item) => item.amal === 'Yangilandi').length;
  const deleted = logs.filter((item) => item.amal === "O'chirildi").length;
  const lastActivity = logs[0]?.sana;

  const daily = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const day = daysAgo(13 - i);
    return { name: day.slice(5), amallar: logs.filter((item) => item.sana.slice(0, 10) === day).length };
  }), [logs]);

  const filteredLogs = useMemo(() => logs.filter((item) => {
    const matchesQuery = `${item.amal} ${item.model} ${item.obyekt} ${item.izoh}`.toLowerCase().includes(query.toLowerCase());
    const matchesRange = isInRange(item.sana.slice(0, 10), range.start, range.end);
    return matchesQuery && matchesRange;
  }), [logs, query, range]);

  useEffect(() => setPage(1), [query, range]);

  const pages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const rows = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  if (!employee) {
    return <div><PageHeader title="Hodim topilmadi" description="Bu hodim o‘chirilgan yoki mavjud emas." actions={<button className="btn-secondary" onClick={() => navigate('/hodimlar')}><ArrowLeft size={18} /> Hodimlarga qaytish</button>} /></div>;
  }

  return (
    <div>
      <PageHeader
        title={`${employee.ism} ${employee.familiya}`.trim()}
        description={`Login: ${employee.username}${employee.email ? ` · ${employee.email}` : ''} · ${employee.faol ? 'Faol' : 'Nofaol'}`}
        actions={<button className="btn-secondary" onClick={() => navigate('/hodimlar')}><ArrowLeft size={18} /> Hodimlarga qaytish</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Jami amallar" value={`${logs.length} ta`} icon={ListChecks} tone="blue" />
        <KpiCard title="Yaratilgan" value={`${created} ta`} icon={PlusCircle} tone="green" />
        <KpiCard title="Yangilangan" value={`${updated} ta`} icon={History} tone="amber" />
        <KpiCard title="O‘chirilgan" value={`${deleted} ta`} icon={Trash2} tone="red" />
      </div>

      <div className="mt-6 card p-5">
        <div className="mb-5 flex items-center justify-between">
          <div><h2 className="font-bold">So‘nggi 14 kunlik faollik</h2><p className="text-sm text-slate-500">Har kunlik amallar soni</p></div>
          <p className="text-sm text-slate-500">{lastActivity ? `Oxirgi amal: ${formatDate(lastActivity)}` : 'Hali amal qilmagan'}</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <Tooltip />
              <Bar dataKey="amallar" name="Amallar" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 card overflow-hidden">
        <div className="border-b p-5"><h2 className="font-bold">Amallari</h2><p className="text-sm text-slate-500">Bu hodim tomonidan qilingan barcha o‘zgarishlar</p></div>
        <div className="flex flex-col gap-3 border-b p-5 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative self-start lg:max-w-sm lg:flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bo‘lim, obyekt yoki izoh bo‘yicha qidirish..." /></label>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
        {/* Mobile: card list */}
        <div className="divide-y lg:hidden">
          {rows.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-slate-500">{formatDate(item.sana)}</p>
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
            <thead className="table-head"><tr><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Amal</th><th className="px-4 py-3">Bo‘lim</th><th className="px-4 py-3">Obyekt</th><th className="px-4 py-3">Izoh</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{formatDate(item.sana)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${actionTone[item.amal] ?? 'bg-slate-100 text-slate-600'}`}>{item.amal}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.model}</td>
                  <td className="px-4 py-3">{item.obyekt}</td>
                  <td className="px-4 py-3 text-slate-500">{item.izoh || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState text={logs.length ? 'Filtr bo‘yicha amal topilmadi' : 'Bu hodim hali hech qanday amal bajarmagan'} />}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
    </div>
  );
}
