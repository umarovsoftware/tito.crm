import type { DebtStatus } from '../types';

export function StockBadge({ current, minimum }: { current: number; minimum: number }) {
  const low = current <= minimum;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${low ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{low ? 'Kam qolgan' : 'Yetarli'}</span>;
}

export function DebtBadge({ status }: { status: DebtStatus }) {
  const classes: Record<DebtStatus, string> = {
    'Qarzdor': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
    'Qisman to‘langan': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    'Qarz yopilgan': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    'Muddati o‘tgan': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{status}</span>;
}
