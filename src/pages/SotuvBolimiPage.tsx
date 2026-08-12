import { Plus, ShoppingBag, UsersRound, Wallet } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/PageHeader';
import { useAppStore } from '../store/AppStore';
import { getGuestCode, getSaleCode, saleTotal } from '../utils/sale';
import { today } from '../utils/date';
import { formatMoney } from '../utils/format';

export function SotuvBolimiPage() {
  const { data } = useAppStore();
  const navigate = useNavigate();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);

  const todaySales = useMemo(() => data.sales.filter((sale) => sale.sana === today()), [data.sales]);
  const todayTotal = todaySales.reduce((sum, sale) => sum + saleTotal(sale), 0);
  const debtSalesToday = todaySales.filter((sale) => sale.tolovTuri === 'Qarz').length;

  return (
    <div>
      <PageHeader
        title="Sotuv bo‘limi"
        description="Bugungi savdo va tezkor mijoz xizmati."
        actions={<button className="btn-primary" onClick={() => navigate('/sotuvlar/yangi')}><Plus size={18} /> Yangi sotuv</button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Bugungi sotuvlar" value={`${todaySales.length} ta`} icon={ShoppingBag} tone="blue" />
        <KpiCard title="Bugungi savdo summasi" value={money(todayTotal)} icon={Wallet} tone="green" />
        <KpiCard title="Qarzga sotilgan" value={`${debtSalesToday} ta`} icon={UsersRound} tone="amber" />
      </div>
      <div className="mt-6 card overflow-hidden">
        <div className="flex items-center justify-between border-b p-5">
          <div><h2 className="font-bold">Bugungi sotuvlar</h2><p className="text-sm text-slate-500">So‘nggi amalga oshirilgan xaridlar</p></div>
          <button className="btn-secondary" onClick={() => navigate('/sotuvlar')}>Barcha sotuvlar</button>
        </div>
        <div className="divide-y">
          {todaySales.slice().sort((a, b) => getSaleCode(b).localeCompare(getSaleCode(a))).map((sale) => {
            const customer = data.customers.find((item) => item.id === sale.customerId);
            return (
              <div key={sale.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-slate-500">{getSaleCode(sale)}</p>
                  <p className="truncate text-sm font-semibold">{sale.saleTuri === 'Tasodifiy xaridor' ? `Tasodifiy xaridor · ${getGuestCode(sale)}` : (customer?.ism ?? 'Mijoz topilmadi')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{money(saleTotal(sale))}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${sale.tolovTuri === 'Qarz' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>{sale.tolovTuri}</span>
                </div>
              </div>
            );
          })}
        </div>
        {!todaySales.length && <EmptyState text="Bugun hali sotuv qilinmagan" />}
      </div>
    </div>
  );
}
