import { Edit3, Hash, PackageCheck, Plus, QrCode, Search, ShoppingBag, Trash2, Truck, UserRound, UsersRound, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScannerModal } from '../components/BarcodeScannerModal';
import { BarcodeScannerPanel } from '../components/BarcodeScannerPanel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { NumberInput } from '../components/NumberInput';
import { SearchSelect } from '../components/SearchSelect';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import { useHidScanner } from '../hooks/useHidScanner';
import type { PaymentType, Sale, SaleType } from '../types';
import { createInitialSale, getGuestCode, getSaleCode, saleTotal, type SaleFormItem, type SaleFormState } from '../utils/sale';
import { formatDate, formatMoney } from '../utils/format';
import { numberOrZero } from '../utils/numberInput';

type SaleTypeFilter = 'Barchasi' | SaleType;

export function SalesPage() {
  const { data, saveSale, deleteSale } = useAppStore();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [payment, setPayment] = useState('Barchasi');
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleTypeFilter>('Barchasi');
  const [form, setForm] = useState<SaleFormState>(() => createInitialSale());
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

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
  const edit = (sale: Sale) => { const { id, createdAt: _createdAt, jamiSumma: _total, ...rest } = sale; setForm({ ...rest, id, items: sale.items.map(({ id: _id, jamiSumma: _lineTotal, ...item }) => item) }); setOpen(true); };
  const changeSaleType = (saleTuri: SaleType) => setForm((current) => ({ ...current, saleTuri, customerId: saleTuri === 'Doimiy mijoz' ? current.customerId || data.customers[0]?.id || '' : '', tolovTuri: saleTuri === 'Tasodifiy xaridor' && current.tolovTuri === 'Qarz' ? 'Naqd' : current.tolovTuri, ulgurjiSavdo: saleTuri === 'Doimiy mijoz' && current.ulgurjiSavdo, yetkazibBerish: saleTuri === 'Doimiy mijoz' && current.yetkazibBerish, yetkazibBerishManzili: saleTuri === 'Doimiy mijoz' ? current.yetkazibBerishManzili : '' }));
  const addItem = () => { const perfume = data.perfumes.find((item) => item.qoldiq > 0 && !form.items.some((line) => line.perfumeId === item.id)); if (perfume) setForm((current) => ({ ...current, items: [...current.items, { perfumeId: perfume.id, miqdor: 1, sotuvNarxi: perfume.sotuvNarxi }] })); };
  const changeItem = (index: number, patch: Partial<SaleFormItem>) => setForm((current) => ({ ...current, items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item) }));
  const removeItem = (index: number) => setForm((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }));
  const handleScanned = (code: string) => {
    const match = data.perfumes.find((item) => item.barcode === code);
    if (!match) return showToast(`"${code}" barcode bo‘yicha mahsulot topilmadi.`, 'error');
    setForm((current) => {
      const existingIndex = current.items.findIndex((item) => item.perfumeId === match.id);
      if (existingIndex === -1) return { ...current, items: [...current.items, { perfumeId: match.id, miqdor: 1, sotuvNarxi: match.sotuvNarxi }] };
      return { ...current, items: current.items.map((item, index) => index === existingIndex ? { ...item, miqdor: numberOrZero(item.miqdor) + 1 } : item) };
    });
    showToast(`${match.firmaNomi} ${match.tovarNomi} qo‘shildi.`);
  };
  // Mutually exclusive with the list-level quick-scan below: while the edit modal is open, a
  // physical scan should add an item to it, not trigger the list's "open a new sale" shortcut.
  useHidScanner(open, handleScanned);
  const total = form.items.reduce((sum, item) => sum + numberOrZero(item.miqdor) * numberOrZero(item.sotuvNarxi), 0);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const items = form.items.map((item) => ({ ...item, miqdor: numberOrZero(item.miqdor), sotuvNarxi: numberOrZero(item.sotuvNarxi) }));
    if (!items.length || items.some((item) => !item.perfumeId || item.miqdor < 1 || item.sotuvNarxi <= 0)) return showToast('Har bir mahsulot qatorini to‘g‘ri to‘ldiring.', 'warning');
    if (new Set(items.map((item) => item.perfumeId)).size !== items.length) return showToast('Bitta mahsulotni faqat bitta qatorda kiriting.', 'warning');
    if (form.saleTuri === 'Doimiy mijoz' && !form.customerId) return showToast('Doimiy mijozni tanlang.', 'warning');
    if (form.yetkazibBerish && !form.yetkazibBerishManzili.trim()) return showToast('Yetkazib berish manzilini kiriting.', 'warning');
    setSaving(true);
    const result = await saveSale({ ...form, items });
    setSaving(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast('Sotuv yangilandi.');
    setOpen(false); setForm(createInitialSale());
  };
  const handleListScan = (code: string) => {
    const match = data.perfumes.find((item) => item.barcode === code);
    if (!match) return showToast(`"${code}" barcode bo‘yicha mahsulot topilmadi.`, 'error');
    navigate('/sotuvlar/yangi', { state: { scannedPerfumeId: match.id } });
  };
  useHidScanner(!open, handleListScan);

  return <div>
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sotuvlar</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Bir xaridda bir nechta mahsulotni bitta chek sifatida rasmiylashtiring.</p>
        </div>
        <div><button className="btn-primary" onClick={() => navigate('/sotuvlar/yangi')}><Plus size={18} /> Sotuv</button></div>
        <div className="grid gap-3 md:grid-cols-2"><button className={`card flex items-center gap-4 p-4 text-left ${saleTypeFilter === 'Doimiy mijoz' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setSaleTypeFilter((value) => value === 'Doimiy mijoz' ? 'Barchasi' : 'Doimiy mijoz')}><UsersRound className="text-blue-600" /><span><span className="block text-sm text-slate-500">Doimiy mijoz</span><b className="text-2xl">{regularCount} ta xarid</b></span></button><button className={`card flex items-center gap-4 p-4 text-left ${saleTypeFilter === 'Tasodifiy xaridor' ? 'ring-2 ring-slate-500' : ''}`} onClick={() => setSaleTypeFilter((value) => value === 'Tasodifiy xaridor' ? 'Barchasi' : 'Tasodifiy xaridor')}><UserRound /><span><span className="block text-sm text-slate-500">Tasodifiy xaridor</span><b className="text-2xl">{guestCount} ta xarid</b></span></button></div>
        <div className="card grid gap-3 p-4 md:grid-cols-[1fr_220px_240px]"><label className="relative self-start"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sotuv ID, mahsulot yoki mijoz..." /></label><select className="input" value={payment} onChange={(event) => setPayment(event.target.value)}><option>Barchasi</option><option>Naqd</option><option>Karta</option><option>O‘tkazma</option><option>Qarz</option></select><select className="input" value={saleTypeFilter} onChange={(event) => setSaleTypeFilter(event.target.value as SaleTypeFilter)}><option>Barchasi</option><option>Doimiy mijoz</option><option>Tasodifiy xaridor</option></select></div>
      </div>
      <div className="h-full xl:sticky xl:top-6">
        <BarcodeScannerPanel onDetected={handleListScan} title="Tezkor sotuv" description="Kamera yoki tashqi skaner bilan o‘qiting — yangi sotuv sahifasi ochiladi" fillHeight />
      </div>
    </div>
    <div className="card mt-6 overflow-hidden">
      {/* Mobile: card list */}
      <div className="divide-y lg:hidden">
        {rows.map((sale) => {
          const customer = data.customers.find((item) => item.id === sale.customerId);
          return (
            <div key={sale.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-mono text-xs font-semibold">{getSaleCode(sale)}</p><p className="text-xs text-slate-500">{formatDate(sale.sana)}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sale.tolovTuri === 'Qarz' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{sale.tolovTuri}</span>
              </div>
              <div className="mt-2">{sale.saleTuri === 'Tasodifiy xaridor' ? <p className="text-sm">Tasodifiy xaridor · <span className="font-mono text-xs text-slate-500">{getGuestCode(sale)}</span></p> : <p className="text-sm">{customer?.ism ?? 'Mijoz topilmadi'} <span className="text-xs text-slate-500">{customer?.telefon}</span></p>}</div>
              <div className="mt-2 space-y-0.5">{sale.items.map((line) => { const product = data.perfumes.find((item) => item.id === line.perfumeId); return <p key={line.perfumeId} className="text-sm">{product ? `${product.firmaNomi} ${product.tovarNomi}` : '—'} <span className="text-slate-500">× {line.miqdor}</span></p>; })}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-slate-500">{sale.yetkazibBerish ? <><Truck size={14} /> Yetkaziladi</> : <><PackageCheck size={14} /> Olib ketildi</>}</span>
                <b>{money(saleTotal(sale))}</b>
              </div>
              <div className="mt-3 flex justify-end gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => edit(sale)}><Edit3 size={17} /></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(sale.id)}><Trash2 size={17} /></button></div>
            </div>
          );
        })}
      </div>
      {/* Desktop: condensed table */}
      <div className="hidden overflow-x-auto lg:block"><table className="w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Sotuv</th><th className="px-4 py-3">Mahsulotlar</th><th className="px-4 py-3">Xaridor</th><th className="px-4 py-3">Jami</th><th className="px-4 py-3">To‘lov</th><th className="px-4 py-3">Topshirish</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead><tbody className="divide-y">{rows.map((sale) => { const customer = data.customers.find((item) => item.id === sale.customerId); return <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40"><td className="px-4 py-3 whitespace-nowrap"><p className="font-mono text-xs font-semibold">{getSaleCode(sale)}</p><p className="text-xs text-slate-500">{formatDate(sale.sana)}</p></td><td className="px-4 py-3">{sale.items.map((line) => { const product = data.perfumes.find((item) => item.id === line.perfumeId); return <p key={line.perfumeId} className="font-medium">{product ? `${product.firmaNomi} ${product.tovarNomi}` : '—'} <span className="text-slate-500">× {line.miqdor}</span></p>; })}</td><td className="px-4 py-3 whitespace-nowrap">{sale.saleTuri === 'Tasodifiy xaridor' ? <><p>Tasodifiy xaridor</p><p className="font-mono text-xs text-slate-500">{getGuestCode(sale)}</p></> : <><p>{customer?.ism ?? 'Mijoz topilmadi'}</p><p className="text-xs text-slate-500">{customer?.telefon}</p></>}</td><td className="px-4 py-3 whitespace-nowrap font-bold">{money(saleTotal(sale))}</td><td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sale.tolovTuri === 'Qarz' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{sale.tolovTuri}</span></td><td className="px-4 py-3 whitespace-nowrap">{sale.yetkazibBerish ? <span className="flex items-center gap-1 text-blue-600"><Truck size={15} /> Yetkaziladi</span> : <span className="flex items-center gap-1 text-slate-500"><PackageCheck size={15} /> Olib ketildi</span>}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => edit(sale)}><Edit3 size={17} /></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(sale.id)}><Trash2 size={17} /></button></div></td></tr>; })}</tbody></table></div>
      {!rows.length && <EmptyState />}
    </div>
    <Modal open={open} title="Sotuvni tahrirlash" onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><button type="button" className={`rounded-2xl border p-4 text-left ${form.saleTuri === 'Doimiy mijoz' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}`} onClick={() => changeSaleType('Doimiy mijoz')}><UsersRound className="mb-2 text-blue-600" size={22} /><b className="block">Doimiy mijoz</b></button><button type="button" className={`rounded-2xl border p-4 text-left ${form.saleTuri === 'Tasodifiy xaridor' ? 'border-slate-500 bg-slate-50 dark:bg-slate-800/60' : ''}`} onClick={() => changeSaleType('Tasodifiy xaridor')}><ShoppingBag className="mb-2" size={22} /><b className="block">Tasodifiy xaridor</b></button></div>{form.saleTuri === 'Doimiy mijoz' ? <div><label className="label">Doimiy mijoz *</label><select className="input" value={form.customerId} onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value, yetkazibBerishManzili: current.yetkazibBerish ? data.customers.find((item) => item.id === event.target.value)?.manzil ?? '' : current.yetkazibBerishManzili }))}><option value="">Mijozni tanlang</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.ism} — {customer.telefon}</option>)}</select></div> : <div className="rounded-2xl border border-dashed p-4"><Hash className="inline mr-2" size={18} /> Tasodifiy xaridorga kod saqlanganda yaratiladi.</div>}
      <div className="rounded-2xl border p-4"><div className="mb-3 flex items-center justify-between"><div><b>Mahsulotlar *</b><p className="text-xs text-slate-500">Bitta xaridga bir nechta mahsulot qo‘shing.</p></div><div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => setScannerOpen(true)}><QrCode size={16} /> Skanerlash</button><button type="button" className="btn-secondary" onClick={addItem}><Plus size={16} /> Qator qo‘shish</button></div></div><div className="space-y-3">{form.items.map((line, index) => { const product = data.perfumes.find((item) => item.id === line.perfumeId); const perfumeOptions = data.perfumes.map((perfume) => ({ value: perfume.id, label: `${perfume.firmaNomi} ${perfume.tovarNomi}`, sublabel: `${perfume.qoldiq} dona`, disabled: form.items.some((item, itemIndex) => itemIndex !== index && item.perfumeId === perfume.id) })); return <div key={`${line.perfumeId}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_100px_130px_36px]"><SearchSelect value={line.perfumeId} onChange={(perfumeId) => { const selected = data.perfumes.find((item) => item.id === perfumeId); changeItem(index, { perfumeId, sotuvNarxi: selected?.sotuvNarxi ?? '' }); }} options={perfumeOptions} placeholder="Mahsulotni tanlang" /><NumberInput min="1" value={line.miqdor} onValueChange={(value) => changeItem(index, { miqdor: value })} /><NumberInput min="1" value={line.sotuvNarxi} onValueChange={(value) => changeItem(index, { sotuvNarxi: value })} /><button type="button" className="rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40" disabled={form.items.length === 1} onClick={() => removeItem(index)} aria-label="Qatorni o‘chirish"><X size={18} /></button>{product && numberOrZero(line.miqdor) > product.qoldiq && !form.id && <p className="sm:col-span-4 text-xs text-red-600">Qoldiq: {product.qoldiq} dona</p>}</div>; })}</div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="label">To‘lov turi</label><select className="input" value={form.tolovTuri} onChange={(event) => setForm({ ...form, tolovTuri: event.target.value as PaymentType })}><option>Naqd</option><option>Karta</option><option>O‘tkazma</option>{form.saleTuri === 'Doimiy mijoz' && <option>Qarz</option>}</select></div><div><label className="label">Sana</label><input className="input" type="date" value={form.sana} onChange={(event) => setForm({ ...form, sana: event.target.value })} /></div></div>
      {form.saleTuri === 'Doimiy mijoz' && <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50"><label className="flex gap-3"><input type="checkbox" checked={form.ulgurjiSavdo} onChange={(event) => setForm({ ...form, ulgurjiSavdo: event.target.checked })} /><span>Ulgurji savdo</span></label><label className="flex gap-3"><input type="checkbox" checked={form.yetkazibBerish} onChange={(event) => setForm({ ...form, yetkazibBerish: event.target.checked, yetkazibBerishManzili: event.target.checked ? form.yetkazibBerishManzili || selectedCustomer?.manzil || '' : '' })} /><span>Yetkazib berish kerak</span></label>{form.yetkazibBerish && <input className="input" value={form.yetkazibBerishManzili} onChange={(event) => setForm({ ...form, yetkazibBerishManzili: event.target.value })} placeholder="Yetkazib berish manzili" />}</div>}
      <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30"><div className="flex justify-between"><span>Jami mahsulot qatori</span><b>{form.items.length} ta</b></div><div className="mt-2 flex justify-between"><span>Sotuv summasi</span><b>{money(total)}</b></div></div><div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Bekor qilish</button><button className="btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button></div></form></Modal>
    <ConfirmDialog open={Boolean(deleteId)} message="Sotuv o‘chirilsa, barcha mahsulot qoldiqlari tiklanadi." onClose={() => setDeleteId(null)} loading={deleting} onConfirm={async () => { if (!deleteId) return; setDeleting(true); const result = await deleteSale(deleteId); setDeleting(false); showToast(result.ok ? 'Sotuv o‘chirildi.' : result.message, result.ok ? 'success' : 'error'); setDeleteId(null); }} />
    <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleScanned} continuous />
  </div>;
}
