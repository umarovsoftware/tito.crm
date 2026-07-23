import type { LucideIcon } from 'lucide-react';

export function KpiCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: LucideIcon; tone: 'blue' | 'green' | 'red' | 'amber' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40', green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40', red: 'bg-red-50 text-red-600 dark:bg-red-950/40', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' };
  return <div className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p></div><div className={`rounded-2xl p-3 ${tones[tone]}`}><Icon size={22} /></div></div></div>;
}
