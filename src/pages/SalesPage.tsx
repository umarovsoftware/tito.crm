import {
  Edit3,
  Hash,
  PackageCheck,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { PaymentType, Sale, SaleType } from '../types';
import { today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';

type FormState = Omit<Sale, 'id' | 'createdAt'> & { id?: string };
type SaleTypeFilter = 'Barchasi' | SaleType;

const createInitial = (saleTuri: SaleType = 'Doimiy mijoz'): FormState => ({
  sotuvKodi: '',
  saleTuri,
  perfumeId: '',
  customerId: '',
  xaridorKodi: '',
  miqdor: 1,
  sotuvNarxi: 0,
  tolovTuri: 'Naqd',
  ulgurjiSavdo: false,
  yetkazibBerish: false,
  yetkazibBerishManzili: '',
  sana: today(),
});

const getSaleType = (sale: Sale): SaleType => sale.saleTuri ?? 'Doimiy mijoz';
const getSaleCode = (sale: Sale) => sale.sotuvKodi || sale.id;
const getGuestCode = (sale: Sale) => sale.xaridorKodi || `TX-${sale.id.slice(-8).toUpperCase()}`;

export function SalesPage() {
  const { data, saveSale, deleteSale } = useAppStore();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [payment, setPayment] = useState('Barchasi');
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleTypeFilter>('Barchasi');
  const [form, setForm] = useState<FormState>(() => createInitial());
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const regularCount = data.sales.filter((sale) => getSaleType(sale) === 'Doimiy mijoz').length;
  const guestCount = data.sales.filter((sale) => getSaleType(sale) === 'Tasodifiy xaridor').length;

  const rows = useMemo(() => data.sales
    .filter((sale) => {
      const perfume = data.perfumes.find((item) => item.id === sale.perfumeId);
      const customer = data.customers.find((item) => item.id === sale.customerId);
      const type = getSaleType(sale);
      const searchable = [
        getSaleCode(sale),
        getGuestCode(sale),
        perfume?.firmaNomi,
        perfume?.tovarNomi,
        customer?.ism,
        customer?.telefon,
      ].join(' ').toLowerCase();

      return searchable.includes(query.toLowerCase())
        && (payment === 'Barchasi' || sale.tolovTuri === payment)
        && (saleTypeFilter === 'Barchasi' || type === saleTypeFilter);
    })
    .sort((a, b) => b.sana.localeCompare(a.sana) || getSaleCode(b).localeCompare(getSaleCode(a))), [data, query, payment, saleTypeFilter]);

  const product = data.perfumes.find((item) => item.id === form.perfumeId);
  const selectedCustomer = data.customers.find((item) => item.id === form.customerId);
  const oldQuantity = form.id && data.sales.find((sale) => sale.id === form.id)?.perfumeId === form.perfumeId
    ? data.sales.find((sale) => sale.id === form.id)?.miqdor ?? 0
    : 0;
  const availableQuantity = (product?.qoldiq ?? 0) + oldQuantity;

  const startAdd = (saleTuri: SaleType) => {
    const perfume = data.perfumes.find((item) => item.qoldiq > 0);
    const customer = data.customers[0];
    setForm({
      ...createInitial(saleTuri),
      perfumeId: perfume?.id ?? '',
      sotuvNarxi: perfume?.sotuvNarxi ?? 0,
      customerId: saleTuri === 'Doimiy mijoz' ? customer?.id ?? '' : '',
    });
    setOpen(true);
  };

  const changeSaleType = (saleTuri: SaleType) => {
    setForm((current) => ({
      ...current,
      saleTuri,
      customerId: saleTuri === 'Doimiy mijoz' ? current.customerId || data.customers[0]?.id || '' : '',
      xaridorKodi: saleTuri === 'Tasodifiy xaridor' ? current.xaridorKodi : '',
      tolovTuri: saleTuri === 'Tasodifiy xaridor' && current.tolovTuri === 'Qarz' ? 'Naqd' : current.tolovTuri,
      ulgurjiSavdo: saleTuri === 'Doimiy mijoz' ? current.ulgurjiSavdo : false,
      yetkazibBerish: saleTuri === 'Doimiy mijoz' ? current.yetkazibBerish : false,
      yetkazibBerishManzili: saleTuri === 'Doimiy mijoz' ? current.yetkazibBerishManzili : '',
    }));
  };

  const edit = (item: Sale) => {
    const { createdAt: _, ...rest } = item;
    setForm({
      ...createInitial(getSaleType(item)),
      ...rest,
      saleTuri: getSaleType(item),
      sotuvKodi: getSaleCode(item),
      xaridorKodi: getSaleType(item) === 'Tasodifiy xaridor' ? getGuestCode(item) : '',
      ulgurjiSavdo: Boolean(item.ulgurjiSavdo),
      yetkazibBerish: Boolean(item.yetkazibBerish),
      yetkazibBerishManzili: item.yetkazibBerishManzili ?? '',
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!form.perfumeId || form.miqdor <= 0 || form.sotuvNarxi <= 0) {
      showToast('Parfyum, miqdor va sotuv narxini to‘g‘ri kiriting.', 'warning');
      return;
    }
    if (form.saleTuri === 'Doimiy mijoz' && !form.customerId) {
      showToast('Doimiy mijozni tanlang.', 'warning');
      return;
    }
    if (form.saleTuri === 'Tasodifiy xaridor' && form.tolovTuri === 'Qarz') {
      showToast('Tasodifiy xaridorga qarzga sotuv mumkin emas.', 'warning');
      return;
    }
    if (form.yetkazibBerish && !form.yetkazibBerishManzili.trim()) {
      showToast('Yetkazib berish manzilini kiriting.', 'warning');
      return;
    }

    const result = await saveSale(form);
    if (!result.ok) {
      showToast(result.message, 'error');
      return;
    }

    const message = form.saleTuri === 'Tasodifiy xaridor'
      ? 'Tasodifiy sotuv saqlandi va noyob xaridor kodi yaratildi.'
      : 'Doimiy mijoz savdosi saqlandi. Qoldiq avtomatik kamaytirildi.';
    showToast(form.id ? 'Sotuv yangilandi.' : message);
    setOpen(false);
    setForm(createInitial());
  };

  const remove = async () => {
    if (!deleteId) return;
    const result = await deleteSale(deleteId);
    showToast(result.ok ? 'Sotuv o‘chirildi, qoldiq tiklandi.' : result.message, result.ok ? 'success' : 'error');
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader
        title="Sotuvlar"
        description="Doimiy mijozlar va tasodifiy xaridorlar savdosini alohida boshqaring."
        actions={(
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => startAdd('Tasodifiy xaridor')}>
              <ShoppingBag size={18} /> Tasodifiy sotuv
            </button>
            <button className="btn-primary" onClick={() => startAdd('Doimiy mijoz')}>
              <Plus size={18} /> Doimiy mijozga sotuv
            </button>
          </div>
        )}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <button
          className={`card flex items-center gap-4 p-4 text-left transition ${saleTypeFilter === 'Doimiy mijoz' ? 'ring-2 ring-blue-500' : 'hover:border-blue-200'}`}
          onClick={() => setSaleTypeFilter((current) => current === 'Doimiy mijoz' ? 'Barchasi' : 'Doimiy mijoz')}
        >
          <span className="rounded-2xl bg-blue-100 p-3 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><UsersRound size={24} /></span>
          <span>
            <span className="block text-sm text-slate-500">Doimiy mijoz / ulgurji</span>
            <b className="text-2xl">{regularCount} ta savdo</b>
          </span>
        </button>
        <button
          className={`card flex items-center gap-4 p-4 text-left transition ${saleTypeFilter === 'Tasodifiy xaridor' ? 'ring-2 ring-slate-500' : 'hover:border-slate-300'}`}
          onClick={() => setSaleTypeFilter((current) => current === 'Tasodifiy xaridor' ? 'Barchasi' : 'Tasodifiy xaridor')}
        >
          <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><UserRound size={24} /></span>
          <span>
            <span className="block text-sm text-slate-500">Tasodifiy xaridor</span>
            <b className="text-2xl">{guestCount} ta savdo</b>
          </span>
        </button>
      </div>

      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_220px_240px]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="input pl-10"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sotuv ID, xaridor kodi, mahsulot yoki mijoz..."
          />
        </label>
        <select className="input" value={payment} onChange={(event) => setPayment(event.target.value)}>
          <option>Barchasi</option>
          <option>Naqd</option>
          <option>Karta</option>
          <option>O‘tkazma</option>
          <option>Qarz</option>
        </select>
        <select className="input" value={saleTypeFilter} onChange={(event) => setSaleTypeFilter(event.target.value as SaleTypeFilter)}>
          <option>Barchasi</option>
          <option>Doimiy mijoz</option>
          <option>Tasodifiy xaridor</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Sotuv ID</th>
                <th className="px-4 py-3">Sana</th>
                <th className="px-4 py-3">Sotuv turi</th>
                <th className="px-4 py-3">Parfyum</th>
                <th className="px-4 py-3">Xaridor</th>
                <th className="px-4 py-3">Miqdor</th>
                <th className="px-4 py-3">Jami</th>
                <th className="px-4 py-3">To‘lov</th>
                <th className="px-4 py-3">Topshirish</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((sale) => {
                const perfume = data.perfumes.find((item) => item.id === sale.perfumeId);
                const customer = data.customers.find((item) => item.id === sale.customerId);
                const total = sale.miqdor * sale.sotuvNarxi;
                const saleType = getSaleType(sale);
                const isGuest = saleType === 'Tasodifiy xaridor';

                return (
                  <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">{getSaleCode(sale)}</span>
                    </td>
                    <td className="px-4 py-3">{formatDate(sale.sana)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isGuest ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}>
                        {isGuest ? 'Tasodifiy' : 'Doimiy'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{perfume ? `${perfume.firmaNomi} ${perfume.tovarNomi}` : '—'}</td>
                    <td className="px-4 py-3">
                      {isGuest ? (
                        <div>
                          <span className="block font-medium">Tasodifiy xaridor</span>
                          <span className="font-mono text-xs text-slate-500">{getGuestCode(sale)}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="block font-medium">{customer?.ism ?? 'Mijoz topilmadi'}</span>
                          <span className="text-xs text-slate-500">{customer?.telefon ?? '—'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <b>{sale.miqdor} dona</b>
                      {sale.ulgurjiSavdo && <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700">Ulgurji</span>}
                    </td>
                    <td className="px-4 py-3 font-bold">{formatMoney(total)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sale.tolovTuri === 'Qarz' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {sale.tolovTuri}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sale.yetkazibBerish ? (
                        <div className="max-w-[190px]">
                          <span className="flex items-center gap-1 font-semibold text-blue-600"><Truck size={15} /> Yetkaziladi</span>
                          <span className="block truncate text-xs text-slate-500" title={sale.yetkazibBerishManzili}>{sale.yetkazibBerishManzili}</span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500"><PackageCheck size={15} /> Olib ketildi</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => edit(sale)} aria-label="Sotuvni tahrirlash"><Edit3 size={17} /></button>
                        <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(sale.id)} aria-label="Sotuvni o‘chirish"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState />}
      </div>

      <Modal open={open} title={form.id ? 'Sotuvni tahrirlash' : 'Yangi sotuv'} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Sotuv turi *</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition ${form.saleTuri === 'Doimiy mijoz' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:bg-blue-950/30' : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'}`}
                onClick={() => changeSaleType('Doimiy mijoz')}
              >
                <UsersRound className="mb-2 text-blue-600" size={22} />
                <b className="block">Doimiy mijoz</b>
                <span className="text-xs text-slate-500">Ulgurji, qarz va yetkazib berish mumkin</span>
              </button>
              <button
                type="button"
                className={`rounded-2xl border p-4 text-left transition ${form.saleTuri === 'Tasodifiy xaridor' ? 'border-slate-500 bg-slate-50 ring-2 ring-slate-100 dark:bg-slate-800' : 'border-slate-200 hover:border-slate-400 dark:border-slate-700'}`}
                onClick={() => changeSaleType('Tasodifiy xaridor')}
              >
                <ShoppingBag className="mb-2 text-slate-600 dark:text-slate-300" size={22} />
                <b className="block">Tasodifiy xaridor</b>
                <span className="text-xs text-slate-500">Mijoz ma’lumoti talab qilinmaydi</span>
              </button>
            </div>
          </div>

          {form.saleTuri === 'Doimiy mijoz' ? (
            <div>
              <label className="label">Doimiy mijoz *</label>
              <select
                className="input"
                value={form.customerId}
                onChange={(event) => {
                  const customer = data.customers.find((item) => item.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    customerId: event.target.value,
                    yetkazibBerishManzili: current.yetkazibBerish ? customer?.manzil ?? '' : current.yetkazibBerishManzili,
                  }));
                }}
              >
                <option value="">Mijozni tanlang</option>
                {data.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.ism} — {customer.telefon}</option>)}
              </select>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-white p-2 text-slate-600 shadow-sm dark:bg-slate-900"><Hash size={20} /></span>
                <div>
                  <b className="block">Tasodifiy xaridor kodi</b>
                  <span className="font-mono text-sm text-slate-500">{form.xaridorKodi || 'Saqlanganda TX-... kodi avtomatik yaratiladi'}</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="label">Parfyumni tanlash *</label>
            <select
              className="input"
              value={form.perfumeId}
              onChange={(event) => {
                const perfume = data.perfumes.find((item) => item.id === event.target.value);
                setForm((current) => ({ ...current, perfumeId: event.target.value, sotuvNarxi: perfume?.sotuvNarxi ?? 0 }));
              }}
            >
              <option value="">Tanlang</option>
              {data.perfumes.map((perfume) => (
                <option key={perfume.id} value={perfume.id}>{perfume.firmaNomi} {perfume.tovarNomi} — {perfume.qoldiq} dona</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Miqdor *</label>
              <input className="input" type="number" min="1" value={form.miqdor} onChange={(event) => setForm({ ...form, miqdor: Number(event.target.value) })} />
            </div>
            <div>
              <label className="label">Sotuv narxi *</label>
              <input className="input" type="number" min="1" value={form.sotuvNarxi} onChange={(event) => setForm({ ...form, sotuvNarxi: Number(event.target.value) })} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">To‘lov turi</label>
              <select className="input" value={form.tolovTuri} onChange={(event) => setForm({ ...form, tolovTuri: event.target.value as PaymentType })}>
                <option>Naqd</option>
                <option>Karta</option>
                <option>O‘tkazma</option>
                {form.saleTuri === 'Doimiy mijoz' && <option>Qarz</option>}
              </select>
            </div>
            <div>
              <label className="label">Sana</label>
              <input className="input" type="date" value={form.sana} onChange={(event) => setForm({ ...form, sana: event.target.value })} />
            </div>
          </div>

          {form.saleTuri === 'Doimiy mijoz' && (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                  type="checkbox"
                  checked={form.ulgurjiSavdo}
                  onChange={(event) => setForm({ ...form, ulgurjiSavdo: event.target.checked })}
                />
                <span>
                  <b className="block text-sm">Ulgurji / ko‘p miqdordagi savdo</b>
                  <span className="text-xs text-slate-500">Doimiy mijoz katta miqdorda mahsulot olib ketmoqda</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                  type="checkbox"
                  checked={form.yetkazibBerish}
                  onChange={(event) => setForm({
                    ...form,
                    yetkazibBerish: event.target.checked,
                    yetkazibBerishManzili: event.target.checked ? form.yetkazibBerishManzili || selectedCustomer?.manzil || '' : '',
                  })}
                />
                <span>
                  <b className="block text-sm">Yetkazib berish kerak</b>
                  <span className="text-xs text-slate-500">Buyurtma mijoz manziliga yuboriladi</span>
                </span>
              </label>
              {form.yetkazibBerish && (
                <div>
                  <label className="label">Yetkazib berish manzili *</label>
                  <input
                    className="input"
                    value={form.yetkazibBerishManzili}
                    onChange={(event) => setForm({ ...form, yetkazibBerishManzili: event.target.value })}
                    placeholder="Tuman, ko‘cha va uy raqami"
                  />
                </div>
              )}
            </div>
          )}

          {product && (
            <div className={`rounded-2xl p-4 text-sm ${form.miqdor > availableQuantity ? 'bg-red-50 text-red-700 dark:bg-red-950/30' : 'bg-blue-50 dark:bg-blue-950/30'}`}>
              <div className="flex justify-between"><span>Mavjud qoldiq</span><b>{availableQuantity} dona</b></div>
              <div className="mt-2 flex justify-between"><span>Sotuv summasi</span><b>{formatMoney(form.miqdor * form.sotuvNarxi)}</b></div>
              {form.saleTuri === 'Tasodifiy xaridor' && <p className="mt-2 text-slate-600 dark:text-slate-300">Mijoz o‘rniga noyob xaridor kodi saqlanadi.</p>}
              {form.tolovTuri === 'Qarz' && <p className="mt-2 text-red-600">Bu summa real pul kirimiga qo‘shilmaydi.</p>}
              {form.yetkazibBerish && <p className="mt-2 text-blue-600"><Truck className="mr-1 inline" size={15} /> Yetkazib berish: {form.yetkazibBerishManzili || 'manzil kiritilmagan'}</p>}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Bekor qilish</button>
            <button className="btn-primary">Saqlash</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        message="Sotuv o‘chirilsa, mahsulot qoldig‘i tiklanadi va bog‘langan kirim yoki qarz yozuvi qayta hisoblanadi."
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
      />
    </div>
  );
}
