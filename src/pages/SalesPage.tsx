import { Edit3, Hash, PackageCheck, Plus, Search, ShoppingBag, Trash2, Truck, UserRound, UsersRound, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { PaymentType, Sale, SaleItem, SaleType } from '../types';
import { today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';

type FormState = Omit<Sale, 'id' | 'createdAt' | 'sotuvKodi' | 'xaridorKodi' | 'jamiSumma'> & { id?: string; sotuvKodi?: string; xaridorKodi?: string };
type SaleTypeFilter = 'Barchasi' | SaleType;

const createInitial = (saleTuri: SaleType = 'Doimiy mijoz'): FormState => ({
  saleTuri, customerId: '', xaridorKodi: '', items: [], tolovTuri: 'Naqd', ulgurjiSavdo: false,
  yetkazibBerish: false, yetkazibBerishManzili: '', sana: today(),
});
const getSaleCode = (sale: Sale) => sale.sotuvKodi || sale.id;
const getGuestCode = (sale: Sale) => sale.xaridorKodi || `TX-${sale.id.slice(-8).toUpperCase()}`;
const saleTotal = (sale: Pick<Sale, 'items' | 'jamiSumma'>) => Number(sale.jamiSumma ?? sale.items.reduce((sum, item) => sum + item.miqdor * item.sotuvNarxi, 0));

export function SalesPage() {
  const { data, saveSale, deleteSale } = useAppStore();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [payment, setPayment] = useState('Barchasi');
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleTypeFilter>('Barchasi');
  const [form, setForm] = useState<FormState>(() => createInitial());
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const regularCount = data.sales.filter((sale) => sale.saleTuri === 'Doimiy mijoz').length;
  const guestCount = data.sales.filter((sale) => sale.saleTuri === 'Tasodifiy xaridor').length;
  const rows = useMemo(() => data.sales.filter((sale) => {
    const customer = data.customers.find((item) => item.id === sale.customerId);
    const productNames = sale.items.map((line) => data.perfumes.find((item) => item.id === line.perfumeId)).map((item) => `${item?.firmaNomi ?? ''} ${item?.tovarNomi ?? ''}`);
    return [getSaleCode(sale), getGuestCode(sale), customer?.ism, customer?.telefon, ...productNames].join(' ').toLowerCase().includes(query.toLowerCase())
      && (payment === 'Barchasi' || sale.tolovTuri === payment)
      && (saleTypeFilter === 'Barchasi' || sale.saleTuri === saleTypeFilter);
  }).sort((a, b) => b.sana.localeCompare(a.sana) || getSaleCode(b).localeCompare(getSaleCode(a))), [data, query, payment, saleTypeFilter]);

  const selectedCustomer = data.customers.find((item) => item.id === form.customerId);
  const startAdd = (saleTuri: SaleType) => {
    const perfume = data.perfumes.find((item) => item.qoldiq > 0);
    setForm({ ...createInitial(saleTuri), customerId: saleTuri === 'Doimiy mijoz' ? data.customers[0]?.id ?? '' : '', items: perfume ? [{ perfumeId: perfume.id, miqdor: 1, sotuvNarxi: perfume.sotuvNarxi }] : [] });
    setOpen(true);
  };
  const edit = (sale: Sale) => { const { id, createdAt: _createdAt, jamiSumma: _total, ...rest } = sale; setForm({ ...rest, id, items: sale.items.map(({ id: _id, jamiSumma: _lineTotal, ...item }) => item) }); setOpen(true); };
  const changeSaleType = (saleTuri: SaleType) => setForm((current) => ({ ...current, saleTuri, customerId: saleTuri === 'Doimiy mijoz' ? current.customerId || data.customers[0]?.id || '' : '', tolovTuri: saleTuri === 'Tasodifiy xaridor' && current.tolovTuri === 'Qarz' ? 'Naqd' : current.tolovTuri, ulgurjiSavdo: saleTuri === 'Doimiy mijoz' && current.ulgurjiSavdo, yetkazibBerish: saleTuri === 'Doimiy mijoz' && current.yetkazibBerish, yetkazibBerishManzili: saleTuri === 'Doimiy mijoz' ? current.yetkazibBerishManzili : '' }));
  const addItem = () => { const perfume = data.perfumes.find((item) => item.qoldiq > 0 && !form.items.some((line) => line.perfumeId === item.id)); if (perfume) setForm((current) => ({ ...current, items: [...current.items, { perfumeId: perfume.id, miqdor: 1, sotuvNarxi: perfume.sotuvNarxi }] })); };
  const changeItem = (index: number, patch: Partial<SaleItem>) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  const removeItem = (index: number) => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  const total = form.items.reduce((sum, item) => sum + item.miqdor * item.sotuvNarxi, 0);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.items.length || form.items.some((item) => !item.perfumeId || item.miqdor < 1 || item.sotuvNarxi <= 0)) return showToast('Har bir mahsulot qatorini to‘g‘ri to‘ldiring.', 'warning');
    if (new Set(form.items.map((item) => item.perfumeId)).size !== form.items.length) return showToast('Bitta mahsulotni faqat bitta qatorda kiriting.', 'warning');
    if (form.saleTuri === 'Doimiy mijoz' && !form.customerId) return showToast('Doimiy mijozni tanlang.', 'warning');
    if (form.yetkazibBerish && !form.yetkazibBerishManzili.trim()) return showToast('Yetkazib berish manzilini kiriting.', 'warning');
    const result = await saveSale(form);
    if (!result.ok) return showToast(result.message, 'error');
    showToast(form.id ? 'Sotuv yangilandi.' : 'Sotuv saqlandi, barcha qoldiqlar yangilandi.');
    setOpen(false); setForm(createInitial());
  };

  return <div>
    <PageHeader title="Sotuvlar" description="Bir xaridda bir nechta mahsulotni bitta chek sifatida rasmiylashtiring." actions={<div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={() => startAdd('Tasodifiy xaridor')}><ShoppingBag size={18} /> Tasodifiy sotuv</button><button className="btn-primary" onClick={() => startAdd('Doimiy mijoz')}><Plus size={18} /> Doimiy mijozga sotuv</button></div>} />
    <div className="mb-4 grid gap-3 md:grid-cols-2"><button className={`card flex items-center gap-4 p-4 text-left ${saleTypeFilter === 'Doimiy mijoz' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSaleTypeFilter((value) => value === 'Doimiy mijoz' ? 'Barchasi' : 'Doimiy mijoz')}><UsersRound className="text-blue-600" /><span><span className="block text-sm text-slate-500">Doimiy mijoz</span><b className="text-2xl">{regularCount} ta xarid</b></span></button><button className={`card flex items-center gap-4 p-4 text-left ${saleTypeFilter === 'Tasodifiy xaridor' ? 'ring-2 ring-slate-500' : ''}`} onClick={() => setSaleTypeFilter((value) => value === 'Tasodifiy xaridor' ? 'Barchasi' : 'Tasodifiy xaridor')}><UserRound /><span><span className="block text-sm text-slate-500">Tasodifiy xaridor</span><b className="text-2xl">{guestCount} ta xarid</b></span></button></div>
    <div className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_220px_240px]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sotuv ID, mahsulot yoki mijoz..." /></label><select className="input" value={payment} onChange={(event) => setPayment(event.target.value)}><option>Barchasi</option><option>Naqd</option><option>Karta</option><option>O‘tkazma</option><option>Qarz</option></select><select className="input" value={saleTypeFilter} onChange={(event) => setSaleTypeFilter(event.target.value as SaleTypeFilter)}><option>Barchasi</option><option>Doimiy mijoz</option><option>Tasodifiy xaridor</option></select></div>
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Sotuv ID</th><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Mahsulotlar</th><th className="px-4 py-3">Xaridor</th><th className="px-4 py-3">Jami</th><th className="px-4 py-3">To‘lov</th><th className="px-4 py-3">Topshirish</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead><tbody className="divide-y">{rows.map((sale) => { const customer = data.customers.find((item) => item.id === sale.customerId); return <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="px-4 py-3 font-mono text-xs font-semibold">{getSaleCode(sale)}</td><td className="px-4 py-3">{formatDate(sale.sana)}</td><td className="px-4 py-3">{sale.items.map((line) => { const product = data.perfumes.find((item) => item.id === line.perfumeId); return <p key={line.perfumeId} className="font-medium">{product ? `${product.firmaNomi} ${product.tovarNomi}` : '—'} <span className="text-slate-500">× {line.miqdor}</span></p>; })}</td><td className="px-4 py-3">{sale.saleTuri === 'Tasodifiy xaridor' ? <><p>Tasodifiy xaridor</p><p className="font-mono text-xs text-slate-500">{getGuestCode(sale)}</p></> : <><p>{customer?.ism ?? 'Mijoz topilmadi'}</p><p className="text-xs text-slate-500">{customer?.telefon}</p></>}</td><td className="px-4 py-3 font-bold">{formatMoney(saleTotal(sale))}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sale.tolovTuri === 'Qarz' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{sale.tolovTuri}</span></td><td className="px-4 py-3">{sale.yetkazibBerish ? <span className="flex items-center gap-1 text-blue-600"><Truck size={15} /> Yetkaziladi</span> : <span className="flex items-center gap-1 text-slate-500"><PackageCheck size={15} /> Olib ketildi</span>}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => edit(sale)}><Edit3 size={17} /></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(sale.id)}><Trash2 size={17} /></button></div></td></tr>; })}</tbody></table></div>{!rows.length && <EmptyState />}</div>
    <Modal open={open} title={form.id ? 'Sotuvni tahrirlash' : 'Yangi sotuv'} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><button type="button" className={`rounded-2xl border p-4 text-left ${form.saleTuri === 'Doimiy mijoz' ? 'border-blue-500 bg-blue-50' : ''}`} onClick={() => changeSaleType('Doimiy mijoz')}><UsersRound className="mb-2 text-blue-600" size={22} /><b className="block">Doimiy mijoz</b></button><button type="button" className={`rounded-2xl border p-4 text-left ${form.saleTuri === 'Tasodifiy xaridor' ? 'border-slate-500 bg-slate-50' : ''}`} onClick={() => changeSaleType('Tasodifiy xaridor')}><ShoppingBag className="mb-2" size={22} /><b className="block">Tasodifiy xaridor</b></button></div>{form.saleTuri === 'Doimiy mijoz' ? <div><label className="label">Doimiy mijoz *</label><select className="input" value={form.customerId} onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value, yetkazibBerishManzili: current.yetkazibBerish ? data.customers.find((item) => item.id === event.target.value)?.manzil ?? '' : current.yetkazibBerishManzili }))}><option value="">Mijozni tanlang</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.ism} — {customer.telefon}</option>)}</select></div> : <div className="rounded-2xl border border-dashed p-4"><Hash className="inline mr-2" size={18} /> Tasodifiy xaridorga kod saqlanganda yaratiladi.</div>}
      <div className="rounded-2xl border p-4"><div className="mb-3 flex items-center justify-between"><div><b>Mahsulotlar *</b><p className="text-xs text-slate-500">Bitta xaridga bir nechta mahsulot qo‘shing.</p></div><button type="button" className="btn-secondary" onClick={addItem}><Plus size={16} /> Qator qo‘shish</button></div><div className="space-y-3">{form.items.map((line, index) => { const product = data.perfumes.find((item) => item.id === line.perfumeId); return <div key={`${line.perfumeId}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_100px_130px_36px]"><select className="input" value={line.perfumeId} onChange={(event) => { const selected = data.perfumes.find((item) => item.id === event.target.value); changeItem(index, { perfumeId: event.target.value, sotuvNarxi: selected?.sotuvNarxi ?? 0 }); }}><option value="">Mahsulotni tanlang</option>{data.perfumes.map((perfume) => <option key={perfume.id} value={perfume.id} disabled={form.items.some((item, itemIndex) => itemIndex !== index && item.perfumeId === perfume.id)}>{perfume.firmaNomi} {perfume.tovarNomi} — {perfume.qoldiq} dona</option>)}</select><input className="input" type="number" min="1" value={line.miqdor} onChange={(event) => changeItem(index, { miqdor: Number(event.target.value) })} /><input className="input" type="number" min="1" value={line.sotuvNarxi} onChange={(event) => changeItem(index, { sotuvNarxi: Number(event.target.value) })} /><button type="button" className="rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40" disabled={form.items.length === 1} onClick={() => removeItem(index)} aria-label="Qatorni o‘chirish"><X size={18} /></button>{product && line.miqdor > product.qoldiq && !form.id && <p className="sm:col-span-4 text-xs text-red-600">Qoldiq: {product.qoldiq} dona</p>}</div>; })}</div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">To‘lov turi</label><select className="input" value={form.tolovTuri} onChange={(event) => setForm({ ...form, tolovTuri: event.target.value as PaymentType })}><option>Naqd</option><option>Karta</option><option>O‘tkazma</option>{form.saleTuri === 'Doimiy mijoz' && <option>Qarz</option>}</select></div><div><label className="label">Sana</label><input className="input" type="date" value={form.sana} onChange={(event) => setForm({ ...form, sana: event.target.value })} /></div></div>
      {form.saleTuri === 'Doimiy mijoz' && <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50"><label className="flex gap-3"><input type="checkbox" checked={form.ulgurjiSavdo} onChange={(event) => setForm({ ...form, ulgurjiSavdo: event.target.checked })} /><span>Ulgurji savdo</span></label><label className="flex gap-3"><input type="checkbox" checked={form.yetkazibBerish} onChange={(event) => setForm({ ...form, yetkazibBerish: event.target.checked, yetkazibBerishManzili: event.target.checked ? form.yetkazibBerishManzili || selectedCustomer?.manzil || '' : '' })} /><span>Yetkazib berish kerak</span></label>{form.yetkazibBerish && <input className="input" value={form.yetkazibBerishManzili} onChange={(event) => setForm({ ...form, yetkazibBerishManzili: event.target.value })} placeholder="Yetkazib berish manzili" />}</div>}
      <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30"><div className="flex justify-between"><span>Jami mahsulot qatori</span><b>{form.items.length} ta</b></div><div className="mt-2 flex justify-between"><span>Sotuv summasi</span><b>{formatMoney(total)}</b></div></div><div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Bekor qilish</button><button className="btn-primary">Saqlash</button></div></form></Modal>
    <ConfirmDialog open={Boolean(deleteId)} message="Sotuv o‘chirilsa, barcha mahsulot qoldiqlari tiklanadi." onClose={() => setDeleteId(null)} onConfirm={async () => { if (!deleteId) return; const result = await deleteSale(deleteId); showToast(result.ok ? 'Sotuv o‘chirildi.' : result.message, result.ok ? 'success' : 'error'); setDeleteId(null); }} />
  </div>;
}
