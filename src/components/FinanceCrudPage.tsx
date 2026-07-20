import { Edit3, LockKeyhole, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useAppStore } from '../store/AppStore';
import type { ExpenseCategory, Income } from '../types';
import { today } from '../utils/date';
import { formatDate, formatMoney } from '../utils/format';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { Modal } from './Modal';
import { PageHeader } from './PageHeader';
import { useToast } from './Toast';

const expenseCategories: ExpenseCategory[] = ['Tovar xaridi', 'Ijara', 'Maosh', 'Transport', 'Reklama', 'Soliq', 'Boshqa'];
const incomeCategories: Income['kategoriya'][] = ['Sotuv', 'Qarz to‘lovi', 'Boshqa'];
type FinanceForm = { id?: string; kategoriya: string; summa: number; sana: string; izoh: string };

export function FinanceCrudPage({ mode }: { mode: 'income' | 'expense' }) {
  const { data, saveIncome, deleteIncome, saveExpense, deleteExpense } = useAppStore();
  const { showToast } = useToast();
  const items = mode === 'income' ? data.incomes : data.expenses;
  const categories = mode === 'income' ? incomeCategories : expenseCategories;
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('Barchasi');
  const [form, setForm] = useState<FinanceForm>({ kategoriya: 'Boshqa', summa: 0, sana: today(), izoh: '' });
  const [open, setOpen] = useState(false); const [deleteId, setDeleteId] = useState<string | null>(null);
  const rows = useMemo(() => items.filter((item) => item.izoh.toLowerCase().includes(query.toLowerCase()) && (category === 'Barchasi' || item.kategoriya === category)).sort((a, b) => b.sana.localeCompare(a.sana)), [items, query, category]);
  const isIncome = mode === 'income';
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.summa <= 0 || !form.sana) return showToast('Summa va sanani toâ€˜gâ€˜ri kiriting.', 'warning');
    const result = await (isIncome ? saveIncome({ ...form, kategoriya: form.kategoriya as Income['kategoriya'] }) : saveExpense({ ...form, kategoriya: form.kategoriya as ExpenseCategory }));
    if (!result.ok) return showToast(result.message, 'error');
    showToast(`${isIncome ? 'Kirim' : 'Chiqim'} saqlandi.`); setOpen(false);
  };
  const remove = async () => {
    if (!deleteId) return;
    const result = await (isIncome ? deleteIncome(deleteId) : deleteExpense(deleteId));
    showToast(result.ok ? `${isIncome ? 'Kirim' : 'Chiqim'} oâ€˜chirildi.` : result.message, result.ok ? 'success' : 'error'); setDeleteId(null);
  };
  const total = rows.reduce((sum, item) => sum + item.summa, 0);
  return <div><PageHeader title={isIncome ? 'Kirimlar' : 'Chiqimlar'} description={isIncome ? 'Real pul kirimlari.' : 'Doâ€˜kon xarajatlari.'} actions={<button className="btn-primary" onClick={() => { setForm({ kategoriya: 'Boshqa', summa: 0, sana: today(), izoh: '' }); setOpen(true); }}><Plus size={18} /> {isIncome ? 'Kirim' : 'Chiqim'} qoâ€˜shish</button>} />
    <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_auto]"><div className="card grid gap-3 p-4 md:grid-cols-2"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Izoh boâ€˜yicha qidirish..." /></label><select className="input" value={category} onChange={(event) => setCategory(event.target.value)}><option>Barchasi</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div><div className="card min-w-64 p-5"><p className="text-sm text-slate-500">Filtr boâ€˜yicha jami</p><p className={`mt-2 text-2xl font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>{formatMoney(total)}</p></div></div>
    <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="min-w-[850px] w-full text-sm"><thead className="table-head"><tr><th className="px-4 py-3">Sana</th><th className="px-4 py-3">Kategoriya</th><th className="px-4 py-3">Izoh</th><th className="px-4 py-3">Manba</th><th className="px-4 py-3">Summa</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead><tbody className="divide-y">{rows.map((item) => <tr key={item.id}><td className="px-4 py-3">{formatDate(item.sana)}</td><td className="px-4 py-3">{item.kategoriya}</td><td className="px-4 py-3">{item.izoh || '—'}</td><td className="px-4 py-3">{item.sourceId ? <span className="inline-flex items-center gap-1 text-xs text-slate-500"><LockKeyhole size={14} /> Avtomatik</span> : 'Qoâ€˜lda'}</td><td className={`px-4 py-3 font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>{formatMoney(item.summa)}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button disabled={Boolean(item.sourceId)} className="rounded-lg p-2 text-blue-600 disabled:opacity-30" onClick={() => { setForm({ id: item.id, kategoriya: item.kategoriya, summa: item.summa, sana: item.sana, izoh: item.izoh }); setOpen(true); }}><Edit3 size={17} /></button><button disabled={Boolean(item.sourceId)} className="rounded-lg p-2 text-red-600 disabled:opacity-30" onClick={() => setDeleteId(item.id)}><Trash2 size={17} /></button></div></td></tr>)}</tbody></table></div>{!rows.length && <EmptyState />}</div>
    <Modal open={open} title={`${form.id ? 'Tahrirlash' : 'Yangi'} ${isIncome ? 'kirim' : 'chiqim'}`} onClose={() => setOpen(false)}><form onSubmit={submit} className="space-y-4"><select className="input" value={form.kategoriya} onChange={(event) => setForm({ ...form, kategoriya: event.target.value })}>{categories.map((item) => <option key={item}>{item}</option>)}</select><input className="input" type="number" min="1" value={form.summa} onChange={(event) => setForm({ ...form, summa: Number(event.target.value) })} /><input className="input" type="date" value={form.sana} onChange={(event) => setForm({ ...form, sana: event.target.value })} /><textarea className="input min-h-24" value={form.izoh} onChange={(event) => setForm({ ...form, izoh: event.target.value })} /><div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Bekor qilish</button><button className="btn-primary">Saqlash</button></div></form></Modal><ConfirmDialog open={Boolean(deleteId)} message="Yozuvni oâ€˜chirishni tasdiqlaysizmi?" onClose={() => setDeleteId(null)} onConfirm={remove} /></div>;
}
