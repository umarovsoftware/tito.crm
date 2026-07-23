import { CalendarClock, CreditCard, History, Search } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { DebtBadge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { Debt } from '../types';
import { today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';

export function DebtorsPage() {
  const { data, addDebtPayment, updateDebt } = useAppStore();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('Barchasi');
  const [selected, setSelected] = useState<Debt | null>(null);
  const [history, setHistory] = useState<Debt | null>(null);
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [dueDebt, setDueDebt] = useState<Debt | null>(null);
  const [due, setDue] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingDue, setSavingDue] = useState(false);

  const rows = useMemo(() => data.debts.filter((d) => `${d.mijozNomi} ${d.telefon}`.toLowerCase().includes(query.toLowerCase()) && (status === 'Barchasi' || d.holat === status)).sort((a, b) => b.qolganQarz - a.qolganQarz), [data.debts, query, status]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (amount <= 0 || amount > selected.qolganQarz) return showToast('To‘lov summasini to‘g‘ri kiriting.', 'warning');
    setSavingPayment(true);
    const result = await addDebtPayment(selected.id, amount, date, note);
    setSavingPayment(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast('Qarz to‘lovi saqlandi va real kirimga qo‘shildi.');
    setSelected(null);
    setAmount(0);
    setNote('');
  };
  const saveDue = async () => {
    if (!dueDebt || !due) return;
    setSavingDue(true);
    const result = await updateDebt(dueDebt.id, due);
    setSavingDue(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast('Qarz muddati yangilandi.');
    setDueDebt(null);
  };

  return (
    <div>
      <PageHeader title="Qarzdorlar" description="Qarz qoldig‘i, muddatlar va to‘lovlar tarixini boshqaring." />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-slate-500">Jami qarzdorlik</p><p className="mt-2 text-2xl font-bold text-red-600">{money(data.debts.reduce((s, d) => s + d.qolganQarz, 0))}</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Ochiq qarzlar</p><p className="mt-2 text-2xl font-bold">{data.debts.filter((d) => d.qolganQarz > 0).length} ta</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Muddati o‘tgan</p><p className="mt-2 text-2xl font-bold text-rose-600">{data.debts.filter((d) => d.holat === 'Muddati o‘tgan').length} ta</p></div>
        <div className="card p-5"><p className="text-sm text-slate-500">Yopilgan qarzlar</p><p className="mt-2 text-2xl font-bold text-emerald-600">{data.debts.filter((d) => d.holat === 'Qarz yopilgan').length} ta</p></div>
      </div>
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-2">
        <label className="relative self-start"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mijoz yoki telefon..." /></label>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option>Barchasi</option><option>Qarzdor</option><option>Qisman to‘langan</option><option>Qarz yopilgan</option><option>Muddati o‘tgan</option></select>
      </div>
      <div className="card overflow-hidden">
        {/* Mobile: card list */}
        <div className="divide-y lg:hidden">
          {rows.map((d) => (
            <div key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{d.mijozNomi}</p><p className="text-xs text-slate-500">{d.telefon}</p></div>
                <DebtBadge status={d.holat} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div><p className="text-xs text-slate-400">Jami qarz</p><p>{money(d.jamiQarz)}</p></div>
                <div><p className="text-xs text-slate-400">To‘langan</p><p className="text-emerald-600">{money(d.tolangan)}</p></div>
                <div><p className="text-xs text-slate-400">Qolgan</p><p className="font-bold text-red-600">{money(d.qolganQarz)}</p></div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Muddat: {formatDate(d.muddat)}</p>
              <div className="mt-3 flex justify-end gap-1">
                <button disabled={d.qolganQarz <= 0} title="To‘lov qo‘shish" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30" onClick={() => { setSelected(d); setAmount(d.qolganQarz); }}><CreditCard size={18} /></button>
                <button title="Muddatni o‘zgartirish" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => { setDueDebt(d); setDue(d.muddat); }}><CalendarClock size={18} /></button>
                <button title="Tarix" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setHistory(d)}><History size={18} /></button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop: condensed table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="table-head"><tr><th className="px-4 py-3">Mijoz</th><th className="px-4 py-3">Jami qarz</th><th className="px-4 py-3">To‘langan</th><th className="px-4 py-3">Qolgan qarz</th><th className="px-4 py-3">Muddat</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3"><p className="font-semibold">{d.mijozNomi}</p><p className="text-xs text-slate-500">{d.telefon}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap">{money(d.jamiQarz)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-emerald-600">{money(d.tolangan)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-red-600">{money(d.qolganQarz)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(d.muddat)}</td>
                  <td className="px-4 py-3"><DebtBadge status={d.holat} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button disabled={d.qolganQarz <= 0} title="To‘lov qo‘shish" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 disabled:opacity-30" onClick={() => { setSelected(d); setAmount(d.qolganQarz); }}><CreditCard size={18} /></button>
                      <button title="Muddatni o‘zgartirish" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => { setDueDebt(d); setDue(d.muddat); }}><CalendarClock size={18} /></button>
                      <button title="Tarix" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setHistory(d)}><History size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState />}
      </div>
      <Modal open={Boolean(selected)} title="Qarz to‘lovi qo‘shish" onClose={() => setSelected(null)}>
        <form onSubmit={submit} className="space-y-4">
          {selected && <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-950/30"><p className="font-semibold">{selected.mijozNomi}</p><p className="mt-1 text-sm text-red-600">Qolgan qarz: {money(selected.qolganQarz)}</p></div>}
          <div><label className="label">To‘lov summasi *</label><input className="input" type="number" onFocus={(e) => e.target.select()} min="1" max={selected?.qolganQarz} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          <div><label className="label">Sana</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="label">Izoh</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Masalan: karta orqali" /></div>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setSelected(null)} disabled={savingPayment}>Bekor qilish</button><button className="btn-primary" disabled={savingPayment}>{savingPayment ? 'Saqlanmoqda...' : 'To‘lovni saqlash'}</button></div>
        </form>
      </Modal>
      <Modal open={Boolean(dueDebt)} title="Qarz muddatini o‘zgartirish" onClose={() => setDueDebt(null)}>
        <div className="space-y-4">
          <div><label className="label">Yangi muddat</label><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={() => setDueDebt(null)} disabled={savingDue}>Bekor qilish</button><button className="btn-primary" onClick={saveDue} disabled={savingDue}>{savingDue ? 'Saqlanmoqda...' : 'Saqlash'}</button></div>
        </div>
      </Modal>
      <Modal open={Boolean(history)} title="Qarz tarixi" onClose={() => setHistory(null)}>
        {history && <div className="space-y-3">{history.tarix.slice().sort((a, b) => b.sana.localeCompare(a.sana)).map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border p-4">
            <div><p className="font-semibold">{item.turi}</p><p className="text-sm text-slate-500">{formatDate(item.sana)} · {item.izoh}</p></div>
            <p className={`font-bold ${item.turi === 'To‘lov' ? 'text-emerald-600' : 'text-red-600'}`}>{item.turi === 'To‘lov' ? '+' : '-'} {money(item.summa)}</p>
          </div>
        ))}</div>}
      </Modal>
    </div>
  );
}
