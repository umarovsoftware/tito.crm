import { AlertTriangle, ArrowRight, Boxes, PackagePlus } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { StockBadge } from '../components/Badge';
import { KpiCard } from '../components/KpiCard';
import { PageHeader } from '../components/PageHeader';
import { useAppStore } from '../store/AppStore';

export function OmborXonasiPage() {
  const { data } = useAppStore();
  const navigate = useNavigate();

  const totalStock = data.perfumes.reduce((sum, item) => sum + item.qoldiq, 0);
  const lowStock = useMemo(() => data.perfumes.filter((item) => item.qoldiq <= item.minimalQoldiq).sort((a, b) => a.qoldiq - b.qoldiq), [data.perfumes]);
  const recentStockIns = useMemo(() => data.stockIns.slice().sort((a, b) => b.sana.localeCompare(a.sana)).slice(0, 8), [data.stockIns]);

  return (
    <div>
      <PageHeader
        title="Ombor xonasi"
        description="Qoldiqlar nazorati va tovar kirimi."
        actions={<button className="btn-primary" onClick={() => navigate('/tovar-kirimi')}><PackagePlus size={18} /> Tovar kirimi qo‘shish</button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Jami mahsulotlar" value={`${data.perfumes.length} xil`} icon={Boxes} tone="blue" />
        <KpiCard title="Jami qoldiq" value={`${totalStock} dona`} icon={Boxes} tone="green" />
        <KpiCard title="Kam qolganlar" value={`${lowStock.length} ta`} icon={AlertTriangle} tone="amber" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b p-5">
            <div><h2 className="font-bold">Kam qolgan mahsulotlar</h2><p className="text-sm text-slate-500">Minimal qoldiqqa yetgan yoki undan past</p></div>
            <button className="btn-secondary" onClick={() => navigate('/ombor')}>Barcha ombor <ArrowRight size={16} /></button>
          </div>
          <div className="divide-y">
            {lowStock.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-4">
                <img src={product.rasm} className="h-11 w-11 rounded-xl object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{product.firmaNomi} {product.tovarNomi}</p><p className="text-xs text-slate-500">{product.hajmiMl} ml · {product.kategoriya}</p></div>
                <div className="text-right"><p className="text-sm font-bold">{product.qoldiq} / {product.minimalQoldiq}</p><StockBadge current={product.qoldiq} minimum={product.minimalQoldiq} /></div>
              </div>
            ))}
          </div>
          {!lowStock.length && <EmptyState text="Kam qolgan mahsulot yo‘q" />}
        </div>
        <div className="card overflow-hidden">
          <div className="border-b p-5"><h2 className="font-bold">So‘nggi tovar kirimlari</h2><p className="text-sm text-slate-500">Omborga so‘nggi kelgan mahsulotlar</p></div>
          <div className="divide-y">
            {recentStockIns.map((item) => {
              const product = data.perfumes.find((p) => p.id === item.perfumeId);
              return (
                <div key={item.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold">{product ? `${product.firmaNomi} ${product.tovarNomi}` : '—'}</p><p className="text-xs text-slate-500">{item.yetkazibBeruvchi} · {item.sana}</p></div>
                    <p className="font-bold text-emerald-600">+{item.miqdor} dona</p>
                  </div>
                </div>
              );
            })}
          </div>
          {!recentStockIns.length && <EmptyState text="Tovar kirimi qayd etilmagan" />}
        </div>
      </div>
    </div>
  );
}
