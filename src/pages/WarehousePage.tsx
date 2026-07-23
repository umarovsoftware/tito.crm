import { ArrowRight, Boxes, PackageCheck, PackageX, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StockBadge } from '../components/Badge';
import { useAppStore } from '../store/AppStore';
import { expectedProfit, purchaseTotal, salesTotal } from '../utils/calculations';
import { formatMoney } from '../utils/format';

export function WarehousePage(){
 const{data}=useAppStore();const money=(value:number)=>formatMoney(value,data.settings.valyuta);const navigate=useNavigate();const purchase=data.perfumes.reduce((s,p)=>s+purchaseTotal(p),0);const sale=data.perfumes.reduce((s,p)=>s+salesTotal(p),0);const low=data.perfumes.filter(p=>p.qoldiq<=p.minimalQoldiq).sort((a,b)=>a.qoldiq-b.qoldiq);
 return <div><PageHeader title="Ombor" description="Ombor qiymati, qoldiq holati va tovar kirimlari nazorati." actions={<button className="btn-primary" onClick={()=>navigate('/tovar-kirimi')}>Tovar kirimiga o‘tish <ArrowRight size={18}/></button>}/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="card p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">Jami qoldiq</p><p className="mt-2 text-2xl font-bold">{data.perfumes.reduce((s,p)=>s+p.qoldiq,0)} dona</p></div><Boxes className="text-blue-600"/></div></div><div className="card p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">Kelish qiymati</p><p className="mt-2 text-2xl font-bold">{money(purchase)}</p></div><PackageCheck className="text-emerald-600"/></div></div><div className="card p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">Sotuv qiymati</p><p className="mt-2 text-2xl font-bold">{money(sale)}</p></div><TrendingUp className="text-blue-600"/></div></div><div className="card p-5"><div className="flex justify-between"><div><p className="text-sm text-slate-500">Kam qolgan</p><p className="mt-2 text-2xl font-bold text-amber-600">{low.length} ta</p></div><PackageX className="text-amber-600"/></div></div></div>
 <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
   <div className="card overflow-hidden">
     <div className="border-b p-5"><h2 className="font-bold">Ombor mahsulotlari</h2><p className="text-sm text-slate-500">Qoldiq va kutilayotgan foyda</p></div>
     {/* Mobile: card list */}
     <div className="divide-y lg:hidden">
       {data.perfumes.slice().sort((a,b)=>a.qoldiq-b.qoldiq).map(p=>(
         <div key={p.id} className="flex gap-3 p-4">
           <img src={p.rasm} className="h-12 w-12 shrink-0 rounded-xl object-cover"/>
           <div className="min-w-0 flex-1">
             <div className="flex items-start justify-between gap-2">
               <div className="min-w-0"><p className="truncate font-semibold">{p.firmaNomi} {p.tovarNomi}</p><p className="text-xs text-slate-500">{p.hajmiMl} ml · {p.kategoriya}</p></div>
               <StockBadge current={p.qoldiq} minimum={p.minimalQoldiq}/>
             </div>
             <div className="mt-2 flex items-center justify-between text-sm">
               <span>Qoldiq: <b>{p.qoldiq}</b> / min. {p.minimalQoldiq}</span>
               <span className="font-semibold text-emerald-600">{money(expectedProfit(p))}</span>
             </div>
           </div>
         </div>
       ))}
     </div>
     {/* Desktop: condensed table */}
     <div className="hidden overflow-x-auto lg:block"><table className="w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Mahsulot</th><th className="px-4 py-3">Qoldiq / min.</th><th className="px-4 py-3">Ombor qiymati</th><th className="px-4 py-3">Kutilayotgan foyda</th><th className="px-4 py-3">Holat</th></tr></thead><tbody className="divide-y">{data.perfumes.slice().sort((a,b)=>a.qoldiq-b.qoldiq).map(p=><tr key={p.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={p.rasm} className="h-10 w-10 rounded-xl object-cover"/><div><p className="font-semibold">{p.firmaNomi} {p.tovarNomi}</p><p className="text-xs text-slate-500">{p.hajmiMl} ml · {p.kategoriya}</p></div></div></td><td className="px-4 py-3 whitespace-nowrap"><b>{p.qoldiq}</b> / {p.minimalQoldiq}</td><td className="px-4 py-3 whitespace-nowrap">{money(purchaseTotal(p))}</td><td className="px-4 py-3 whitespace-nowrap font-semibold text-emerald-600">{money(expectedProfit(p))}</td><td className="px-4 py-3"><StockBadge current={p.qoldiq} minimum={p.minimalQoldiq}/></td></tr>)}</tbody></table></div>
   </div>
   <div className="card overflow-hidden"><div className="border-b p-5"><h2 className="font-bold">So‘nggi tovar kirimlari</h2><p className="text-sm text-slate-500">Omborga kelgan mahsulotlar</p></div><div className="divide-y">{data.stockIns.slice().sort((a,b)=>b.sana.localeCompare(a.sana)).slice(0,10).map(item=>{const p=data.perfumes.find(x=>x.id===item.perfumeId);return <div key={item.id} className="p-4"><div className="flex justify-between gap-3"><div><p className="text-sm font-semibold">{p?.firmaNomi} {p?.tovarNomi}</p><p className="text-xs text-slate-500">{item.yetkazibBeruvchi} · {item.sana}</p></div><p className="font-bold text-emerald-600">+{item.miqdor} dona</p></div></div>})}</div></div>
 </div>
 </div>
}
