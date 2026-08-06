import { ArrowLeft, Hash, Plus, ShoppingBag, UsersRound, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BarcodeScannerPanel } from '../components/BarcodeScannerPanel';
import { NumberInput } from '../components/NumberInput';
import { PageHeader } from '../components/PageHeader';
import { SearchSelect } from '../components/SearchSelect';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { PaymentType, SaleType } from '../types';
import { createInitialSale, type SaleFormItem, type SaleFormState } from '../utils/sale';
import { formatMoney } from '../utils/format';
import { numberOrZero } from '../utils/numberInput';

export function NewSalePage() {
  const { data, saveSale } = useAppStore();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<SaleFormState>(() => {
    const scannedId = (location.state as { scannedPerfumeId?: string } | null)?.scannedPerfumeId;
    const base = createInitialSale('Tasodifiy xaridor');
    const perfume = scannedId ? data.perfumes.find((item) => item.id === scannedId) : undefined;
    if (perfume) return { ...base, items: [{ perfumeId: perfume.id, miqdor: 1, sotuvNarxi: perfume.sotuvNarxi }] };
    return base;
  });
  // The barcode that brought us here (via the sales list's quick-scan panel) is usually still
  // sitting in front of the camera when this page's own scanner starts — seed it as an initial
  // cooldown so that first frame doesn't double the quantity we just set to 1 above.
  const [initialScannedBarcode] = useState<string | undefined>(() => {
    const scannedId = (location.state as { scannedPerfumeId?: string } | null)?.scannedPerfumeId;
    return scannedId ? data.perfumes.find((item) => item.id === scannedId)?.barcode : undefined;
  });

  const selectedCustomer = data.customers.find((item) => item.id === form.customerId);
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
    showToast('Sotuv saqlandi, barcha qoldiqlar yangilandi.');
    navigate('/sotuvlar');
  };

  return (
    <div>
      <PageHeader title="Yangi sotuv" description="Kamera bilan skanerlang yoki qo‘lda tanlang — bir xariddagi barcha mahsulotlar bitta chekka yig‘iladi." actions={<button type="button" className="btn-secondary" onClick={() => navigate('/sotuvlar')}><ArrowLeft size={18} /> Sotuvlarga qaytish</button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
        <form onSubmit={submit} className="card space-y-4 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className={`rounded-2xl border p-4 text-left ${form.saleTuri === 'Doimiy mijoz' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : ''}`} onClick={() => changeSaleType('Doimiy mijoz')}><UsersRound className="mb-2 text-blue-600" size={22} /><b className="block">Doimiy mijoz</b></button>
            <button type="button" className={`rounded-2xl border p-4 text-left ${form.saleTuri === 'Tasodifiy xaridor' ? 'border-slate-500 bg-slate-50 dark:bg-slate-800/60' : ''}`} onClick={() => changeSaleType('Tasodifiy xaridor')}><ShoppingBag className="mb-2" size={22} /><b className="block">Tasodifiy xaridor</b></button>
          </div>
          {form.saleTuri === 'Doimiy mijoz' ? (
            <div><label className="label">Doimiy mijoz *</label><select className="input" value={form.customerId} onChange={(event) => setForm((current) => ({ ...current, customerId: event.target.value, yetkazibBerishManzili: current.yetkazibBerish ? data.customers.find((item) => item.id === event.target.value)?.manzil ?? '' : current.yetkazibBerishManzili }))}><option value="">Mijozni tanlang</option>{data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.ism} — {customer.telefon}</option>)}</select></div>
          ) : (
            <div className="rounded-2xl border border-dashed p-4"><Hash className="mr-2 inline" size={18} /> Tasodifiy xaridorga kod saqlanganda yaratiladi.</div>
          )}
          <div className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center justify-between"><div><b>Mahsulotlar *</b><p className="text-xs text-slate-500">O‘ng tomondagi skaner orqali yoki qo‘lda qo‘shing.</p></div><button type="button" className="btn-secondary" onClick={addItem}><Plus size={16} /> Qator qo‘shish</button></div>
            <div className="space-y-3">
              {form.items.map((line, index) => {
                const product = data.perfumes.find((item) => item.id === line.perfumeId);
                const perfumeOptions = data.perfumes.map((perfume) => ({ value: perfume.id, label: `${perfume.firmaNomi} ${perfume.tovarNomi}`, sublabel: `${perfume.qoldiq} dona`, disabled: form.items.some((item, itemIndex) => itemIndex !== index && item.perfumeId === perfume.id) }));
                return (
                  <div key={`${line.perfumeId}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_100px_130px_36px]">
                    <SearchSelect value={line.perfumeId} onChange={(perfumeId) => { const selected = data.perfumes.find((item) => item.id === perfumeId); changeItem(index, { perfumeId, sotuvNarxi: selected?.sotuvNarxi ?? '' }); }} options={perfumeOptions} placeholder="Mahsulotni tanlang" />
                    <NumberInput min="1" value={line.miqdor} onValueChange={(value) => changeItem(index, { miqdor: value })} />
                    <NumberInput min="1" value={line.sotuvNarxi} onValueChange={(value) => changeItem(index, { sotuvNarxi: value })} />
                    <button type="button" className="rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40" disabled={form.items.length === 1} onClick={() => removeItem(index)} aria-label="Qatorni o‘chirish"><X size={18} /></button>
                    {product && numberOrZero(line.miqdor) > product.qoldiq && <p className="text-xs text-red-600 sm:col-span-4">Qoldiq: {product.qoldiq} dona</p>}
                  </div>
                );
              })}
              {!form.items.length && <p className="text-sm text-slate-400">Hali mahsulot qo‘shilmagan — skanerlang yoki “Qator qo‘shish”ni bosing.</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">To‘lov turi</label><select className="input" value={form.tolovTuri} onChange={(event) => setForm({ ...form, tolovTuri: event.target.value as PaymentType })}><option>Naqd</option><option>Karta</option><option>O‘tkazma</option>{form.saleTuri === 'Doimiy mijoz' && <option>Qarz</option>}</select></div>
            <div><label className="label">Sana</label><input className="input" type="date" value={form.sana} onChange={(event) => setForm({ ...form, sana: event.target.value })} /></div>
          </div>
          {form.saleTuri === 'Doimiy mijoz' && (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <label className="flex gap-3"><input type="checkbox" checked={form.ulgurjiSavdo} onChange={(event) => setForm({ ...form, ulgurjiSavdo: event.target.checked })} /><span>Ulgurji savdo</span></label>
              <label className="flex gap-3"><input type="checkbox" checked={form.yetkazibBerish} onChange={(event) => setForm({ ...form, yetkazibBerish: event.target.checked, yetkazibBerishManzili: event.target.checked ? form.yetkazibBerishManzili || selectedCustomer?.manzil || '' : '' })} /><span>Yetkazib berish kerak</span></label>
              {form.yetkazibBerish && <input className="input" value={form.yetkazibBerishManzili} onChange={(event) => setForm({ ...form, yetkazibBerishManzili: event.target.value })} placeholder="Yetkazib berish manzili" />}
            </div>
          )}
          <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-950/30"><div className="flex justify-between"><span>Jami mahsulot qatori</span><b>{form.items.length} ta</b></div><div className="mt-2 flex justify-between"><span>Sotuv summasi</span><b>{money(total)}</b></div></div>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => navigate('/sotuvlar')} disabled={saving}>Bekor qilish</button><button className="btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button></div>
        </form>
        <div className="xl:sticky xl:top-6">
          <BarcodeScannerPanel onDetected={handleScanned} description="Mahsulotni tuting — ro‘yxatga avtomatik qo‘shiladi" initialSuppressedCode={initialScannedBarcode} />
        </div>
      </div>
    </div>
  );
}
