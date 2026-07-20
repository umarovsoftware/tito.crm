import { ArrowDownAZ, ArrowUpAZ, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StockBadge } from '../components/Badge';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { Category, Perfume } from '../types';
import { expectedProfit, purchaseTotal, salesTotal } from '../utils/calculations';
import { formatMoney } from '../utils/format';

const emptyForm = { firmaNomi: '', tovarNomi: '', kategoriya: 'Erkaklar' as Category, hajmiMl: 100, barcode: '', kelishNarxi: 0, sotuvNarxi: 0, qoldiq: 0, minimalQoldiq: 3, rasm: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80' };
type FormState = typeof emptyForm & { id?: string };

export function PerfumesPage() {
  const { data, savePerfume, deletePerfume } = useAppStore();
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState('Barchasi');
  const [stockFilter, setStockFilter] = useState('Barchasi');
  const [sort, setSort] = useState<{ key: keyof Perfume; dir: 'asc' | 'desc' }>({ key: 'firmaNomi', dir: 'asc' });
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 8;

  useEffect(() => { setQuery(params.get('q') ?? ''); }, [params]);
  useEffect(() => { setPage(1); }, [query, category, stockFilter, sort]);

  const filtered = useMemo(() => data.perfumes.filter((item) => {
    const text = `${item.firmaNomi} ${item.tovarNomi} ${item.barcode}`.toLowerCase();
    const stockOk = stockFilter === 'Barchasi' || (stockFilter === 'Kam qolgan' ? item.qoldiq <= item.minimalQoldiq : item.qoldiq > item.minimalQoldiq);
    return text.includes(query.toLowerCase()) && (category === 'Barchasi' || item.kategoriya === category) && stockOk;
  }).sort((a, b) => {
    const av = a[sort.key]; const bv = b[sort.key];
    const result = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? result : -result;
  }), [data.perfumes, query, category, stockFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const setSorting = (key: keyof Perfume) => setSort((current) => ({ key, dir: current.key === key && current.dir === 'asc' ? 'desc' : 'asc' }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.firmaNomi.trim() || !form.tovarNomi.trim() || !form.barcode.trim()) return showToast('Majburiy maydonlarni to‘ldiring.', 'warning');
    if (form.kelishNarxi <= 0 || form.sotuvNarxi <= 0 || form.sotuvNarxi < form.kelishNarxi) return showToast('Narxlarni to‘g‘ri kiriting.', 'warning');
    const result = savePerfume(form);
    if (!result.ok) return showToast(result.message, 'error');
    showToast(form.id ? 'Parfyum yangilandi.' : 'Parfyum qo‘shildi.'); setOpen(false); setForm(emptyForm);
  };

  const edit = (item: Perfume) => { const { createdAt: _, ...rest } = item; setForm(rest); setOpen(true); };
  const remove = () => {
    if (!deleteId) return;
    const result = deletePerfume(deleteId);
    showToast(result.ok ? 'Parfyum o‘chirildi.' : result.message, result.ok ? 'success' : 'error'); setDeleteId(null);
  };

  return (
    <div>
      <PageHeader title="Parfyumlar" description="Mahsulotlar, narxlar va ombor qoldiqlarini boshqaring." actions={<button className="btn-primary" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus size={18} /> Parfyum qo‘shish</button>} />
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-3">
        <label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Firma, nom yoki barcode..." /></label>
        <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}><option>Barchasi</option><option>Erkaklar</option><option>Ayollar</option><option>Unisex</option></select>
        <select className="input" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}><option>Barchasi</option><option>Kam qolgan</option><option>Yetarli</option></select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto"><table className="min-w-[1450px] w-full text-sm"><thead className="table-head"><tr>
          <th className="px-4 py-3">Mahsulot</th>
          {([['firmaNomi','Firma nomi'],['tovarNomi','Tovar nomi'],['kategoriya','Kategoriya'],['qoldiq','Astatka'],['kelishNarxi','Kelish narxi'],['sotuvNarxi','Sotuv narxi']] as Array<[keyof Perfume,string]>).map(([key,label]) => <th key={key} className="px-4 py-3"><button className="flex items-center gap-1" onClick={() => setSorting(key)}>{label}{sort.key === key ? (sort.dir === 'asc' ? <ArrowDownAZ size={15}/> : <ArrowUpAZ size={15}/>) : null}</button></th>)}
          <th className="px-4 py-3">Kelish summasi</th><th className="px-4 py-3">Sotuv summasi</th><th className="px-4 py-3">Kutilayotgan foyda</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3 text-right">Amallar</th>
        </tr></thead><tbody className="divide-y">
          {rows.map((item) => <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="px-4 py-3"><img src={item.rasm} alt={item.tovarNomi} className="h-12 w-12 rounded-xl object-cover" /></td><td className="px-4 py-3 font-semibold">{item.firmaNomi}</td><td className="px-4 py-3">{item.tovarNomi}<p className="text-xs text-slate-400">{item.hajmiMl} ml · {item.barcode}</p></td><td className="px-4 py-3">{item.kategoriya}</td><td className="px-4 py-3 font-bold">{item.qoldiq} dona</td><td className="px-4 py-3">{formatMoney(item.kelishNarxi)}</td><td className="px-4 py-3">{formatMoney(purchaseTotal(item))}</td><td className="px-4 py-3">{formatMoney(item.sotuvNarxi)}</td><td className="px-4 py-3">{formatMoney(salesTotal(item))}</td><td className="px-4 py-3 font-semibold text-emerald-600">{formatMoney(expectedProfit(item))}</td><td className="px-4 py-3"><StockBadge current={item.qoldiq} minimum={item.minimalQoldiq} /></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40" onClick={() => edit(item)}><Edit3 size={17}/></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setDeleteId(item.id)}><Trash2 size={17}/></button></div></td></tr>)}
        </tbody></table></div>
        {!rows.length && <EmptyState text="Filtr bo‘yicha parfyum topilmadi" />}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      <Modal open={open} title={form.id ? 'Parfyumni tahrirlash' : 'Yangi parfyum'} onClose={() => setOpen(false)} size="lg"><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Firma nomi *</label><input className="input" value={form.firmaNomi} onChange={(e) => setForm({...form, firmaNomi:e.target.value})} /></div>
        <div><label className="label">Tovar nomi *</label><input className="input" value={form.tovarNomi} onChange={(e) => setForm({...form, tovarNomi:e.target.value})} /></div>
        <div><label className="label">Kategoriya</label><select className="input" value={form.kategoriya} onChange={(e) => setForm({...form, kategoriya:e.target.value as Category})}><option>Erkaklar</option><option>Ayollar</option><option>Unisex</option></select></div>
        <div><label className="label">Hajmi (ml)</label><input className="input" type="number" min="1" value={form.hajmiMl} onChange={(e) => setForm({...form, hajmiMl:Number(e.target.value)})} /></div>
        <div><label className="label">Barcode *</label><input className="input" value={form.barcode} onChange={(e) => setForm({...form, barcode:e.target.value})} /></div>
        <div><label className="label">Rasm URL</label><input className="input" value={form.rasm} onChange={(e) => setForm({...form, rasm:e.target.value})} /></div>
        <div><label className="label">Kelish narxi</label><input className="input" type="number" min="0" value={form.kelishNarxi} onChange={(e) => setForm({...form, kelishNarxi:Number(e.target.value)})} /></div>
        <div><label className="label">Sotuv narxi</label><input className="input" type="number" min="0" value={form.sotuvNarxi} onChange={(e) => setForm({...form, sotuvNarxi:Number(e.target.value)})} /></div>
        <div><label className="label">Astatka</label><input className="input" type="number" min="0" value={form.qoldiq} onChange={(e) => setForm({...form, qoldiq:Number(e.target.value)})} /></div>
        <div><label className="label">Minimal qoldiq</label><input className="input" type="number" min="0" value={form.minimalQoldiq} onChange={(e) => setForm({...form, minimalQoldiq:Number(e.target.value)})} /></div>
        <div className="sm:col-span-2 flex justify-end gap-3 pt-2"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Bekor qilish</button><button className="btn-primary">Saqlash</button></div>
      </form></Modal>
      <ConfirmDialog open={Boolean(deleteId)} message="Parfyumni o‘chirishni tasdiqlaysizmi? Tarixiy operatsiyasi mavjud mahsulot o‘chirilmaydi." onClose={() => setDeleteId(null)} onConfirm={remove} />
    </div>
  );
}
