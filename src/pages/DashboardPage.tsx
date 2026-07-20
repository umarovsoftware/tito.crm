import { ArrowDownRight, ArrowUpRight, Boxes, CircleDollarSign, CreditCard, PackageX, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { DebtBadge, StockBadge } from '../components/Badge';
import { useAppStore } from '../store/AppStore';
import type { DateRange } from '../types';
import { grossProfitForSales, purchaseTotal, sumByRange } from '../utils/calculations';
import { daysAgo, getPresetRange, isInRange, today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';

function KpiCard({ title, value, icon: Icon, tone }: { title: string; value: string; icon: typeof ShoppingBag; tone: 'blue' | 'green' | 'red' | 'amber' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40', green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40', red: 'bg-red-50 text-red-600 dark:bg-red-950/40', amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' };
  return <div className="card p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-xl font-bold sm:text-2xl">{value}</p></div><div className={`rounded-2xl p-3 ${tones[tone]}`}><Icon size={22} /></div></div></div>;
}

export function DashboardPage() {
  const { data } = useAppStore();
  const month = getPresetRange('month');
  const [range, setRange] = useState<DateRange>({ preset: 'month', ...month });

  const metrics = useMemo(() => {
    const salesTotal = data.sales.filter((item) => isInRange(item.sana, range.start, range.end)).reduce((sum, item) => sum + item.miqdor * item.sotuvNarxi, 0);
    const realIncome = sumByRange(data.incomes, range.start, range.end);
    const expense = sumByRange(data.expenses, range.start, range.end);
    const gross = grossProfitForSales(data.sales, data.perfumes, range.start, range.end);
    return { salesTotal, realIncome, expense, profit: gross - expense, debt: data.debts.reduce((sum, item) => sum + item.qolganQarz, 0), payable: data.payables.reduce((sum, item) => sum + item.qolganQarz, 0), stock: data.perfumes.reduce((sum, item) => sum + purchaseTotal(item), 0) };
  }, [data, range]);

  const weekly = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = daysAgo(6 - i);
    const amount = data.sales.filter((sale) => sale.sana === date).reduce((sum, sale) => sum + sale.miqdor * sale.sotuvNarxi, 0);
    return { name: new Intl.DateTimeFormat('uz-UZ', { weekday: 'short' }).format(new Date(date)), savdo: amount };
  }), [data.sales]);

  const monthlyFlow = useMemo(() => Array.from({ length: 10 }, (_, i) => {
    const startOffset = 27 - i * 3;
    const dates = [daysAgo(startOffset), daysAgo(startOffset - 1), daysAgo(startOffset - 2)];
    return {
      name: dates[2].slice(5),
      kirim: data.incomes.filter((item) => dates.includes(item.sana)).reduce((sum, item) => sum + item.summa, 0),
      chiqim: data.expenses.filter((item) => dates.includes(item.sana)).reduce((sum, item) => sum + item.summa, 0),
    };
  }), [data.incomes, data.expenses]);

  const topProducts = useMemo(() => {
    const counts = new Map<string, number>();
    data.sales.forEach((sale) => counts.set(sale.perfumeId, (counts.get(sale.perfumeId) ?? 0) + sale.miqdor));
    return [...counts.entries()].map(([id, count]) => ({ product: data.perfumes.find((item) => item.id === id), count })).filter((item) => item.product).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [data]);

  const operations = useMemo(() => [
    ...data.incomes.map((item) => ({ id: item.id, sana: item.sana, title: item.izoh, amount: item.summa, type: 'income' as const })),
    ...data.expenses.map((item) => ({ id: item.id, sana: item.sana, title: item.izoh, amount: item.summa, type: 'expense' as const })),
  ].sort((a, b) => b.sana.localeCompare(a.sana)).slice(0, 7), [data]);

  const todaySales = data.sales.filter((sale) => sale.sana === today()).reduce((sum, sale) => sum + sale.miqdor * sale.sotuvNarxi, 0);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div><p className="text-sm font-semibold text-blue-600">Boshqaruv markazi</p><h1 className="mt-1 text-3xl font-bold">Dashboard</h1><p className="mt-1 text-slate-500">Do‘konning savdo, pul oqimi va ombor holati.</p></div>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <KpiCard title="Bugungi savdo" value={formatMoney(todaySales)} icon={ShoppingBag} tone="blue" />
        <KpiCard title="Real pul kirimi" value={formatMoney(metrics.realIncome)} icon={ArrowUpRight} tone="green" />
        <KpiCard title="Chiqim" value={formatMoney(metrics.expense)} icon={ArrowDownRight} tone="red" />
        <KpiCard title="Sof foyda" value={formatMoney(metrics.profit)} icon={TrendingUp} tone={metrics.profit >= 0 ? 'green' : 'red'} />
        <KpiCard title="Mijozlar qarzi" value={formatMoney(metrics.debt)} icon={CircleDollarSign} tone="red" />
        <KpiCard title="Mening qarzlarim" value={formatMoney(metrics.payable)} icon={CreditCard} tone="amber" />
        <KpiCard title="Ombor qiymati" value={formatMoney(metrics.stock)} icon={Boxes} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="card p-5"><div className="mb-5"><h2 className="font-bold">Haftalik savdo</h2><p className="text-sm text-slate-500">So‘nggi 7 kunlik savdo dinamikasi</p></div><div className="h-72"><ResponsiveContainer><LineChart data={weekly}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickFormatter={(v) => `${Math.round(v / 1000000)} mln`} tickLine={false} axisLine={false} width={62} /><Tooltip formatter={(value) => formatMoney(Number(value))} /><Line type="monotone" dataKey="savdo" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></div>
        <div className="card p-5"><div className="mb-5"><h2 className="font-bold">Oylik kirim va chiqim</h2><p className="text-sm text-slate-500">30 kunlik pul oqimi, 3 kunlik guruhda</p></div><div className="h-72"><ResponsiveContainer><BarChart data={monthlyFlow}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickFormatter={(v) => `${Math.round(v / 1000000)} mln`} tickLine={false} axisLine={false} width={62} /><Tooltip formatter={(value) => formatMoney(Number(value))} /><Bar dataKey="kirim" fill="#10b981" radius={[6, 6, 0, 0]} /><Bar dataKey="chiqim" fill="#ef4444" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden"><div className="border-b p-5"><h2 className="font-bold">Qarzdor mijozlar</h2><p className="text-sm text-slate-500">Eng katta ochiq qarzlar</p></div><div className="divide-y">{data.debts.filter((d) => d.qolganQarz > 0).sort((a,b) => b.qolganQarz-a.qolganQarz).slice(0,5).map((debt) => <div key={debt.id} className="flex items-center justify-between gap-3 p-4"><div><p className="text-sm font-semibold">{debt.mijozNomi}</p><p className="text-xs text-slate-500">{debt.telefon}</p></div><div className="text-right"><p className="text-sm font-bold text-red-600">{formatMoney(debt.qolganQarz)}</p><DebtBadge status={debt.holat} /></div></div>)}</div></div>
        <div className="card overflow-hidden"><div className="border-b p-5"><h2 className="font-bold">Kam qolgan parfyumlar</h2><p className="text-sm text-slate-500">Minimal qoldiqqa yetgan mahsulotlar</p></div><div className="divide-y">{data.perfumes.filter((p) => p.qoldiq <= p.minimalQoldiq).slice(0,5).map((product) => <div key={product.id} className="flex items-center gap-3 p-4"><img src={product.rasm} className="h-11 w-11 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.firmaNomi} {product.tovarNomi}</p><p className="text-xs text-slate-500">{product.hajmiMl} ml</p></div><div className="text-right"><p className="text-sm font-bold">{product.qoldiq} dona</p><StockBadge current={product.qoldiq} minimum={product.minimalQoldiq} /></div></div>)}</div></div>
        <div className="card overflow-hidden"><div className="border-b p-5"><h2 className="font-bold">Eng ko‘p sotilgan</h2><p className="text-sm text-slate-500">Barcha davr bo‘yicha TOP-5</p></div><div className="divide-y">{topProducts.map(({ product, count }, index) => <div key={product!.id} className="flex items-center gap-3 p-4"><span className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-950/40">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product!.firmaNomi} {product!.tovarNomi}</p><p className="text-xs text-slate-500">{product!.kategoriya}</p></div><p className="font-bold">{count} dona</p></div>)}</div></div>
      </div>

      <div className="mt-6 card overflow-hidden"><div className="flex items-center gap-3 border-b p-5"><Wallet className="text-blue-600" /><div><h2 className="font-bold">Oxirgi operatsiyalar</h2><p className="text-sm text-slate-500">Kirim va chiqimlar lentasi</p></div></div><div className="divide-y">{operations.map((item) => <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-4"><div className={`rounded-xl p-2 ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-red-50 text-red-600 dark:bg-red-950/40'}`}>{item.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-slate-500">{formatDate(item.sana)}</p></div><p className={`text-sm font-bold ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{item.type === 'income' ? '+' : '-'} {formatMoney(item.amount)}</p></div>)}</div></div>
    </div>
  );
}
