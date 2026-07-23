import { CreditCard, Edit3, History, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { DebtBadge } from '../components/Badge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { ExpenseCategory, PayableDebt } from '../types';
import { today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';

const categories: ExpenseCategory[] = ['Tovar xaridi', 'Ijara', 'Maosh', 'Transport', 'Reklama', 'Soliq', 'Boshqa'];
const PAGE_SIZE = 8;

interface FormState {
  id?: string;
  yetkazibBeruvchi: string;
  telefon: string;
  kategoriya: ExpenseCategory;
  jamiQarz: number;
  sana: string;
  muddat: string;
  izoh: string;
}

const makeInitial = (): FormState => ({
  yetkazibBeruvchi: '',
  telefon: '',
  kategoriya: 'Tovar xaridi',
  jamiQarz: 0,
  sana: today(),
  muddat: today(),
  izoh: '',
});

export function MyDebtsPage() {
  const { data, savePayable, deletePayable, addPayablePayment } = useAppStore();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);
  const { showToast } = useToast();
  const [savingDebt, setSavingDebt] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Barchasi');
  const [sort, setSort] = useState('remaining-desc');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<FormState>(makeInitial);
  const [formOpen, setFormOpen] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<PayableDebt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(today());
  const [paymentNote, setPaymentNote] = useState('');
  const [historyDebt, setHistoryDebt] = useState<PayableDebt | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const rows = data.payables.filter((item) => {
      const matchesQuery = `${item.yetkazibBeruvchi} ${item.telefon} ${item.izoh} ${item.kategoriya}`
        .toLowerCase()
        .includes(normalizedQuery);
      const matchesStatus = status === 'Barchasi' || item.holat === status;
      return matchesQuery && matchesStatus;
    });

    return rows.sort((a, b) => {
      if (sort === 'due-asc') return a.muddat.localeCompare(b.muddat);
      if (sort === 'supplier-asc') return a.yetkazibBeruvchi.localeCompare(b.yetkazibBeruvchi, 'uz');
      if (sort === 'total-desc') return b.jamiQarz - a.jamiQarz;
      return b.qolganQarz - a.qolganQarz;
    });
  }, [data.payables, query, status, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, status, sort]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const totalRemaining = data.payables.reduce((sum, item) => sum + item.qolganQarz, 0);
  const totalPaid = data.payables.reduce((sum, item) => sum + item.tolangan, 0);
  const overdueCount = data.payables.filter((item) => item.holat === 'Muddati o‘tgan').length;
  const openCount = data.payables.filter((item) => item.qolganQarz > 0).length;

  const startAdd = () => {
    setForm(makeInitial());
    setFormOpen(true);
  };

  const startEdit = (item: PayableDebt) => {
    const opening = item.tarix.find((history) => history.turi === 'Qarz qo‘shildi');
    setForm({
      id: item.id,
      yetkazibBeruvchi: item.yetkazibBeruvchi,
      telefon: item.telefon,
      kategoriya: item.kategoriya,
      jamiQarz: item.jamiQarz,
      sana: opening?.sana ?? item.createdAt.slice(0, 10),
      muddat: item.muddat,
      izoh: item.izoh,
    });
    setFormOpen(true);
  };

  const submitDebt = async (event: FormEvent) => {
    event.preventDefault();
    setSavingDebt(true);
    const result = await savePayable(form);
    setSavingDebt(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast(form.id ? 'Qarz ma’lumotlari yangilandi.' : 'Yangi qarzim qo‘shildi.');
    setFormOpen(false);
    setForm(makeInitial());
  };

  const openPayment = (item: PayableDebt) => {
    setPaymentDebt(item);
    setPaymentAmount(item.qolganQarz);
    setPaymentDate(today());
    setPaymentNote('');
  };

  const submitPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!paymentDebt) return;
    if (paymentAmount <= 0 || paymentAmount > paymentDebt.qolganQarz) return showToast('To‘lov summasini to‘g‘ri kiriting.', 'warning');
    setSavingPayment(true);
    const result = await addPayablePayment(paymentDebt.id, paymentAmount, paymentDate, paymentNote);
    setSavingPayment(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast('Qarz to‘lovi saqlandi va chiqimga qo‘shildi.');
    setPaymentDebt(null);
    setPaymentAmount(0);
    setPaymentNote('');
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deletePayable(deleteId);
    setDeleting(false);
    showToast(result.ok ? 'Qarz yozuvi o‘chirildi.' : result.message, result.ok ? 'success' : 'error');
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader
        title="Qarzlarim"
        description="Firma va yetkazib beruvchilarga to‘lanadigan qarzlar, muddatlar va to‘lovlar tarixi."
        actions={<button className="btn-primary" onClick={startAdd}><Plus size={18} /> Qarz qo‘shish</button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-slate-500">Jami qolgan qarzim</p><p className="mt-2 text-2xl font-bold text-red-600">{money(totalRemaining)}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Ochiq qarzlar</p><p className="mt-2 text-2xl font-bold">{openCount} ta</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Muddati o‘tgan</p><p className="mt-2 text-2xl font-bold text-rose-600">{overdueCount} ta</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Jami to‘laganman</p><p className="mt-2 text-2xl font-bold text-emerald-600">{money(totalPaid)}</p></div>
      </div>

      <div className="card mb-4 grid gap-3 p-4 lg:grid-cols-3">
        <label className="relative self-start">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Firma, telefon yoki izoh..." />
        </label>
        <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option>Barchasi</option>
          <option>Qarzdor</option>
          <option>Qisman to‘langan</option>
          <option>Qarz yopilgan</option>
          <option>Muddati o‘tgan</option>
        </select>
        <select className="input" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="remaining-desc">Qolgan qarz: kattadan</option>
          <option value="total-desc">Jami qarz: kattadan</option>
          <option value="due-asc">Muddat: eng yaqin</option>
          <option value="supplier-asc">Firma: A–Z</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {/* Mobile: card list */}
        <div className="divide-y lg:hidden">
          {rows.map((item) => (
            <div key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{item.yetkazibBeruvchi}</p><p className="text-xs text-slate-500">{item.telefon || 'Telefon kiritilmagan'}</p></div>
                <DebtBadge status={item.holat} />
              </div>
              <p className="mt-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{item.kategoriya}</span></p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><p className="text-xs text-slate-400">Jami qarz</p><p>{money(item.jamiQarz)}</p></div>
                <div><p className="text-xs text-slate-400">To‘langan</p><p className="text-emerald-600">{money(item.tolangan)}</p></div>
                <div><p className="text-xs text-slate-400">Qolgan</p><p className="font-bold text-red-600">{money(item.qolganQarz)}</p></div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Muddat: {formatDate(item.muddat)}{item.izoh ? ` · ${item.izoh}` : ''}</p>
              <div className="mt-3 flex justify-end gap-1">
                <button disabled={item.qolganQarz <= 0} title="To‘lov qilish" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30" onClick={() => openPayment(item)}><CreditCard size={18} /></button>
                <button title="Tahrirlash" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => startEdit(item)}><Edit3 size={18} /></button>
                <button title="Tarix" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setHistoryDebt(item)}><History size={18} /></button>
                <button title="O‘chirish" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(item.id)}><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop: condensed table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="table-head">
              <tr>
                <th className="px-4 py-3">Firma / yetkazib beruvchi</th>
                <th className="px-4 py-3">Kategoriya</th>
                <th className="px-4 py-3">Jami / to‘langan</th>
                <th className="px-4 py-3">Qolgan qarz</th>
                <th className="px-4 py-3">Muddat</th>
                <th className="px-4 py-3">Holat</th>
                <th className="px-4 py-3 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3"><p className="font-semibold">{item.yetkazibBeruvchi}</p><p className="text-xs text-slate-500">{item.telefon || 'Telefon kiritilmagan'}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{item.kategoriya}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap"><p>{money(item.jamiQarz)}</p><p className="text-xs text-emerald-600">To‘langan: {money(item.tolangan)}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-red-600">{money(item.qolganQarz)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.muddat)}</td>
                  <td className="px-4 py-3"><DebtBadge status={item.holat} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button disabled={item.qolganQarz <= 0} title="To‘lov qilish" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30" onClick={() => openPayment(item)}><CreditCard size={18} /></button>
                      <button title="Tahrirlash" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => startEdit(item)}><Edit3 size={18} /></button>
                      <button title="Tarix" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setHistoryDebt(item)}><History size={18} /></button>
                      <button title="O‘chirish" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(item.id)}><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState />}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      <Modal open={formOpen} title={form.id ? 'Qarzni tahrirlash' : 'Yangi qarzim'} onClose={() => setFormOpen(false)} size="lg">
        <form onSubmit={submitDebt} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Firma yoki yetkazib beruvchi *</label><input className="input" value={form.yetkazibBeruvchi} onChange={(event) => setForm({ ...form, yetkazibBeruvchi: event.target.value })} /></div>
            <div><label className="label">Telefon</label><input className="input" value={form.telefon} onChange={(event) => setForm({ ...form, telefon: event.target.value })} placeholder="+998 90 000 00 00" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Qarz kategoriyasi</label><select className="input" value={form.kategoriya} onChange={(event) => setForm({ ...form, kategoriya: event.target.value as ExpenseCategory })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>
            <div><label className="label">Jami qarz *</label><input className="input" type="number" onFocus={(e) => e.target.select()} min="1" value={form.jamiQarz} onChange={(event) => setForm({ ...form, jamiQarz: Number(event.target.value) })} /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Qarz olingan sana *</label><input className="input" type="date" value={form.sana} onChange={(event) => setForm({ ...form, sana: event.target.value })} /></div>
            <div><label className="label">To‘lash muddati *</label><input className="input" type="date" value={form.muddat} onChange={(event) => setForm({ ...form, muddat: event.target.value })} /></div>
          </div>
          <div><label className="label">Izoh</label><textarea className="input min-h-24" value={form.izoh} onChange={(event) => setForm({ ...form, izoh: event.target.value })} placeholder="Masalan: Dior va Chanel tovarlari uchun" /></div>
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Qarz qo‘shilganda pul chiqimi yozilmaydi. To‘lov qilganingizdagina summa avtomatik ravishda “Chiqimlar” bo‘limiga qo‘shiladi.</div>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setFormOpen(false)} disabled={savingDebt}>Bekor qilish</button><button className="btn-primary" disabled={savingDebt}>{savingDebt ? 'Saqlanmoqda...' : 'Saqlash'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(paymentDebt)} title="Qarzimni to‘lash" onClose={() => setPaymentDebt(null)}>
        <form onSubmit={submitPayment} className="space-y-4">
          {paymentDebt && <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/30"><p className="font-semibold">{paymentDebt.yetkazibBeruvchi}</p><p className="mt-1 text-sm text-red-600">Qolgan qarz: {money(paymentDebt.qolganQarz)}</p></div>}
          <div><label className="label">To‘lov summasi *</label><input className="input" type="number" onFocus={(e) => e.target.select()} min="1" max={paymentDebt?.qolganQarz} value={paymentAmount} onChange={(event) => setPaymentAmount(Number(event.target.value))} /></div>
          <div><label className="label">To‘lov sanasi *</label><input className="input" type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} /></div>
          <div><label className="label">Izoh</label><input className="input" value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} placeholder="Masalan: karta orqali" /></div>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setPaymentDebt(null)} disabled={savingPayment}>Bekor qilish</button><button className="btn-primary" disabled={savingPayment}>{savingPayment ? 'Saqlanmoqda...' : 'To‘lovni saqlash'}</button></div>
        </form>
      </Modal>

      <Modal open={Boolean(historyDebt)} title="Qarzim tarixi" onClose={() => setHistoryDebt(null)}>
        {historyDebt && <div className="space-y-3">{historyDebt.tarix.slice().sort((a, b) => b.sana.localeCompare(a.sana)).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border p-4">
            <div><p className="font-semibold">{item.turi}</p><p className="text-sm text-slate-500">{formatDate(item.sana)} · {item.izoh}</p></div>
            <p className={`font-bold ${item.turi === 'To‘lov' ? 'text-emerald-600' : 'text-red-600'}`}>{item.turi === 'To‘lov' ? '−' : '+'} {money(item.summa)}</p>
          </div>
        ))}</div>}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Qarzni o‘chirish"
        message="Qarz yozuvi o‘chirilsa, unga bog‘langan avtomatik to‘lov chiqimlari ham o‘chiriladi. Davom etasizmi?"
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        loading={deleting}
      />
    </div>
  );
}
