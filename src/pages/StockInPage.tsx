import { ArrowLeft, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { SearchSelect } from '../components/SearchSelect';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { StockIn } from '../types';
import { today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';

const initial = { perfumeId: '', miqdor: 1, kelishNarxi: 0, yetkazibBeruvchi: '', sana: today(), izoh: '' };
type FormState = typeof initial & { id?: string };

export function StockInPage() {
  const { data, saveStockIn, deleteStockIn } = useAppStore();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(initial);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rows = useMemo(() => data.stockIns.filter((item) => {
    const product = data.perfumes.find((p) => p.id === item.perfumeId);
    return `${product?.firmaNomi} ${product?.tovarNomi} ${item.yetkazibBeruvchi}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a,b) => b.sana.localeCompare(a.sana)), [data, query]);

  const product = data.perfumes.find((item) => item.id === form.perfumeId);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.perfumeId || form.miqdor <= 0 || form.kelishNarxi <= 0 || !form.yetkazibBeruvchi.trim()) return showToast('Barcha majburiy maydonlarni to‘g‘ri kiriting.', 'warning');
    setSaving(true);
    const result = await saveStockIn(form);
    setSaving(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast(form.id ? 'Tovar kirimi yangilandi.' : 'Tovar kirimi saqlandi. Qoldiq oshirildi.'); setOpen(false); setForm(initial);
  };
  const startAdd = () => { const first = data.perfumes[0]; setForm({ ...initial, perfumeId: first?.id ?? '', kelishNarxi: first?.kelishNarxi ?? 0 }); setOpen(true); };
  const edit = (item: StockIn) => { const { createdAt: _createdAt, ...rest } = item; setForm(rest); setOpen(true); };
  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteStockIn(deleteId);
    setDeleting(false);
    showToast(result.ok ? 'Kirim o‘chirildi.' : result.message, result.ok ? 'success' : 'error');
    setDeleteId(null);
  };

  return <div>
    <PageHeader title="Tovar kirimi" description="Yetkazib beruvchidan kelgan mahsulotlarni omborga kiriting." actions={<div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={() => navigate('/ombor')}><ArrowLeft size={18}/> Omborga qaytish</button><button className="btn-primary" onClick={startAdd}><Plus size={18}/> Tovar kirimi</button></div>} />
    <div className="card mb-4 p-4"><label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input className="input pl-10" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Mahsulot yoki yetkazib beruvchi..."/></label></div>
    <div className="card overflow-hidden">
      {/* Mobile: card list */}
      <div className="divide-y lg:hidden">
        {rows.map((item) => { const p = data.perfumes.find((x) => x.id === item.perfumeId); return (
          <div key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-semibold">{p ? `${p.firmaNomi} ${p.tovarNomi}` : 'O‘chirilgan mahsulot'}</p><p className="text-xs text-slate-500">{formatDate(item.sana)} · {item.yetkazibBeruvchi}</p></div>
              <b>{money(item.miqdor * item.kelishNarxi)}</b>
            </div>
            <div className="mt-2 text-sm text-slate-500">{item.miqdor} dona × {money(item.kelishNarxi)}{item.izoh ? ` · ${item.izoh}` : ''}</div>
            <div className="mt-3 flex justify-end gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={()=>edit(item)}><Edit3 size={17}/></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={()=>setDeleteId(item.id)}><Trash2 size={17}/></button></div>
          </div>
        ); })}
      </div>
      {/* Desktop: condensed table */}
      <div className="hidden overflow-x-auto lg:block"><table className="w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Parfyum</th><th className="px-4 py-3">Miqdor</th><th className="px-4 py-3">Kelish narxi</th><th className="px-4 py-3">Jami summa</th><th className="px-4 py-3">Yetkazib beruvchi</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead><tbody className="divide-y">{rows.map((item)=>{const p=data.perfumes.find((x)=>x.id===item.perfumeId);return <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="px-4 py-3 whitespace-nowrap">{formatDate(item.sana)}</td><td className="px-4 py-3 font-semibold">{p ? `${p.firmaNomi} ${p.tovarNomi}` : 'O‘chirilgan mahsulot'}{item.izoh ? <p className="text-xs font-normal text-slate-400">{item.izoh}</p> : null}</td><td className="px-4 py-3 whitespace-nowrap">{item.miqdor} dona</td><td className="px-4 py-3 whitespace-nowrap">{money(item.kelishNarxi)}</td><td className="px-4 py-3 whitespace-nowrap font-bold">{money(item.miqdor*item.kelishNarxi)}</td><td className="px-4 py-3">{item.yetkazibBeruvchi}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={()=>edit(item)}><Edit3 size={17}/></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={()=>setDeleteId(item.id)}><Trash2 size={17}/></button></div></td></tr>})}</tbody></table></div>
      {!rows.length&&<EmptyState/>}
    </div>
    <Modal open={open} title={form.id?'Tovar kirimini tahrirlash':'Yangi tovar kirimi'} onClose={()=>setOpen(false)}><form onSubmit={submit} className="space-y-4">
      <div><label className="label">Parfyumni tanlash *</label><SearchSelect value={form.perfumeId} onChange={(perfumeId)=>{const p=data.perfumes.find(x=>x.id===perfumeId);setForm({...form,perfumeId,kelishNarxi:p?.kelishNarxi??0})}} options={data.perfumes.map((p)=>({value:p.id,label:`${p.firmaNomi} ${p.tovarNomi}`,sublabel:`qoldiq ${p.qoldiq}`}))} placeholder="Tanlang" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">Miqdor *</label><input className="input" type="number" onFocus={(e) => e.target.select()} min="1" value={form.miqdor} onChange={(e)=>setForm({...form,miqdor:Number(e.target.value)})}/></div><div><label className="label">Kelish narxi *</label><input className="input" type="number" onFocus={(e) => e.target.select()} min="1" value={form.kelishNarxi} onChange={(e)=>setForm({...form,kelishNarxi:Number(e.target.value)})}/></div></div>
      <div><label className="label">Firma yoki yetkazib beruvchi *</label><input className="input" value={form.yetkazibBeruvchi} onChange={(e)=>setForm({...form,yetkazibBeruvchi:e.target.value})}/></div>
      <div><label className="label">Sana *</label><input className="input" type="date" value={form.sana} onChange={(e)=>setForm({...form,sana:e.target.value})}/></div>
      <div><label className="label">Izoh</label><textarea className="input min-h-24" value={form.izoh} onChange={(e)=>setForm({...form,izoh:e.target.value})}/></div>
      {product&&<div className="rounded-2xl bg-blue-50 p-4 text-sm dark:bg-blue-950/30"><div className="flex justify-between"><span>Joriy qoldiq</span><b>{product.qoldiq} dona</b></div><div className="mt-2 flex justify-between"><span>Kirim summasi</span><b>{money(form.miqdor*form.kelishNarxi)}</b></div></div>}
      <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={()=>setOpen(false)} disabled={saving}>Bekor qilish</button><button className="btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button></div>
    </form></Modal>
    <ConfirmDialog open={Boolean(deleteId)} message="Kirim o‘chirilsa, mahsulot qoldig‘i va unga bog‘liq chiqim ham kamayadi." onClose={()=>setDeleteId(null)} onConfirm={remove} loading={deleting}/>
  </div>;
}
