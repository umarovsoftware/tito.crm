import { Edit3, LockKeyhole, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useAppStore } from '../store/AppStore';
import type { ExpenseCategory, Income } from '../types';
import { today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';
import { NumberInput } from './NumberInput';
import { PageHeader } from './PageHeader';
import { useToast } from './Toast';
import { numberOrZero, type NumberInputValue } from '../utils/numberInput';

const expenseCategories: ExpenseCategory[] = ['Tovar xaridi', 'Ijara', 'Maosh', 'Transport', 'Reklama', 'Soliq', 'Boshqa'];
const incomeCategories: Income['kategoriya'][] = ['Sotuv', 'Qarz to‘lovi', 'Boshqa'];
type FinanceForm = { id?: string; kategoriya: string; summa: NumberInputValue; sana: string; izoh: string };

export function FinanceCrudPage({ mode }: { mode: 'income' | 'expense' }) {
  const { data, saveIncome, deleteIncome, saveExpense, deleteExpense } = useAppStore();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);
  const { showToast } = useToast();
  const items = mode === 'income' ? data.incomes : data.expenses;
  const categories = mode === 'income' ? incomeCategories : expenseCategories;
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('Barchasi');
  const [form, setForm] = useState<FinanceForm>({ kategoriya: 'Boshqa', summa: '', sana: today(), izoh: '' });
  const [open, setOpen] = useState(false); const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const rows = useMemo(() => items.filter((item) => item.izoh.toLowerCase().includes(query.toLowerCase()) && (category === 'Barchasi' || item.kategoriya === category)).sort((a, b) => b.sana.localeCompare(a.sana)), [items, query, category]);
  const isIncome = mode === 'income';
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const summa = numberOrZero(form.summa);
    if (summa <= 0 || !form.sana) return showToast('Summa va sanani to‘g‘ri kiriting.', 'warning');
    setSaving(true);
    const result = await (isIncome ? saveIncome({ ...form, summa, kategoriya: form.kategoriya as Income['kategoriya'] }) : saveExpense({ ...form, summa, kategoriya: form.kategoriya as ExpenseCategory }));
    setSaving(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast(`${isIncome ? 'Kirim' : 'Chiqim'} saqlandi.`); setOpen(false);
  };
  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await (isIncome ? deleteIncome(deleteId) : deleteExpense(deleteId));
    setDeleting(false);
    showToast(result.ok ? `${isIncome ? 'Kirim' : 'Chiqim'} o‘chirildi.` : result.message, result.ok ? 'success' : 'error'); setDeleteId(null);
  };
  const total = rows.reduce((sum, item) => sum + item.summa, 0);
  return <div><PageHeader title={isIncome ? 'Kirimlar' : 'Chiqimlar'} description={isIncome ? 'Real pul kirimlari.' : 'Do‘kon xarajatlari.'} actions={<button className="btn-primary" onClick={() => { setForm({ kategoriya: 'Boshqa', summa: '', sana: today(), izoh: '' }); setOpen(true); }}><Plus size={18} /> {isIncome ? 'Kirim' : 'Chiqim'} qo‘shish</button>} />
    <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_auto]"><div className="card grid gap-3 p-4 md:grid-cols-2"><label className="relative self-start"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Izoh bo‘yicha qidirish..." /></label><select className="input" value={category} onChange={(event) => setCategory(event.target.value)}><option>Barchasi</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="card min-w-64 p-5"><p className="text-sm text-slate-500">Filtr bo‘yicha jami</p><p className={`mt-2 text-2xl font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>{money(total)}</p></div></div>
    <div className="card overflow-hidden">
      {/* Mobile: card list */}
      <div className="divide-y lg:hidden">
        {rows.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-medium">{item.kategoriya}</p><p className="text-xs text-slate-500">{formatDate(item.sana)}</p></div>
              <p className={`font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>{money(item.summa)}</p>
            </div>
            {item.izoh && <p className="mt-1 text-sm text-slate-500">{item.izoh}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">{item.sourceId && <LockKeyhole size={13} />} {item.sourceId ? 'Avtomatik' : 'Qo‘lda'}</span>
              <div className="flex gap-1"><button disabled={Boolean(item.sourceId)} className="rounded-lg p-2 text-blue-600 disabled:opacity-30" onClick={() => { setForm({ id: item.id, kategoriya: item.kategoriya, summa: item.summa, sana: item.sana, izoh: item.izoh }); setOpen(true); }}><Edit3 size={17} /></button><button disabled={Boolean(item.sourceId)} className="rounded-lg p-2 text-red-600 disabled:opacity-30" onClick={() => setDeleteId(item.id)}><Trash2 size={17} /></button></div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop: condensed table */}
      <div className="hidden overflow-x-auto lg:block"><table className="w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Kategoriya</th><th className="px-4 py-3">Izoh</th><th className="px-4 py-3">Manba</th><th className="px-4 py-3">Summa</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead><tbody className="divide-y">{rows.map((item) => <tr key={item.id}><td className="px-4 py-3 whitespace-nowrap">{formatDate(item.sana)}</td><td className="px-4 py-3 whitespace-nowrap">{item.kategoriya}</td><td className="px-4 py-3">{item.izoh || '—'}</td><td className="px-4 py-3 whitespace-nowrap">{item.sourceId ? <span className="inline-flex items-center gap-1 text-xs text-slate-500"><LockKeyhole size={14} /> Avtomatik</span> : 'Qo‘lda'}</td><td className={`px-4 py-3 whitespace-nowrap font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>{money(item.summa)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button disabled={Boolean(item.sourceId)} className="rounded-lg p-2 text-blue-600 disabled:opacity-30" onClick={() => { setForm({ id: item.id, kategoriya: item.kategoriya, summa: item.summa, sana: item.sana, izoh: item.izoh }); setOpen(true); }}><Edit3 size={17} /></button><button disabled={Boolean(item.sourceId)} className="rounded-lg p-2 text-red-600 disabled:opacity-30" onClick={() => setDeleteId(item.id)}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>
      {!rows.length && <EmptyState />}
    </div>
    <Modal open={open} title={`${form.id ? 'Tahrirlash' : 'Yangi'} ${isIncome ? 'kirim' : 'chiqim'}`} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-4"><select className="input" value={form.kategoriya} onChange={(event) => setForm({ ...form, kategoriya: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select><NumberInput min="1" value={form.summa} onValueChange={(value) => setForm({ ...form, summa: value })} /><input className="input" type="date" value={form.sana} onChange={(event) => setForm({ ...form, sana: event.target.value })} /><textarea className="input min-h-24" value={form.izoh} onChange={(event) => setForm({ ...form, izoh: event.target.value })} /><div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Bekor qilish</button><button className="btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button></div></form></Modal><ConfirmDialog open={Boolean(deleteId)} message="Yozuvni o‘chirishni tasdiqlaysizmi?" onClose={() => setDeleteId(null)} onConfirm={remove} loading={deleting} /></div>;
}
