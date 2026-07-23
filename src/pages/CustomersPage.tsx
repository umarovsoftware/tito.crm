import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { Customer } from '../types';
import { formatDate, formatMoney } from '../utils/format';

const initial = { ism: '', telefon: '', manzil: '' };
type FormState = typeof initial & { id?: string };

export function CustomersPage() {
  const { data, saveCustomer, deleteCustomer } = useAppStore();
  const money = (value: number) => formatMoney(value, data.settings.valyuta);
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(initial);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 8;

  const filtered = useMemo(() => data.customers.filter((c) => `${c.ism} ${c.telefon} ${c.manzil}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.ism.localeCompare(b.ism)), [data.customers, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.ism.trim() || !form.telefon.trim()) return showToast('Mijoz ismi va telefoni majburiy.', 'warning');
    setSaving(true);
    const result = await saveCustomer(form);
    setSaving(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast(form.id ? 'Mijoz yangilandi.' : 'Mijoz qo‘shildi.');
    setOpen(false);
    setForm(initial);
  };
  const edit = (c: Customer) => { const { createdAt: _createdAt, ...rest } = c; setForm(rest); setOpen(true); };
  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteCustomer(deleteId);
    setDeleting(false);
    showToast(result.ok ? 'Mijoz o‘chirildi.' : result.message, result.ok ? 'success' : 'error');
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader title="Mijozlar" description="Mijozlar bazasi, aloqa ma’lumotlari va savdo ko‘rsatkichlari." actions={<button className="btn-primary" onClick={() => { setForm(initial); setOpen(true); }}><Plus size={18} /> Mijoz qo‘shish</button>} />
      <div className="card mb-4 p-4"><label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input pl-10" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Ism, telefon yoki manzil..." /></label></div>
      <div className="card overflow-hidden">
        {/* Mobile: card list */}
        <div className="divide-y lg:hidden">
          {rows.map((c) => {
            const sales = data.sales.filter((s) => s.customerId === c.id);
            const debt = data.debts.filter((d) => d.mijozId === c.id).reduce((s, d) => s + d.qolganQarz, 0);
            return (
              <div key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold">{c.ism}</p><p className="text-xs text-slate-500">{c.telefon}{c.manzil ? ` · ${c.manzil}` : ''}</p></div>
                  <p className={`text-sm font-semibold ${debt ? 'text-red-600' : 'text-emerald-600'}`}>{money(debt)}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-xs text-slate-400">Xaridlar soni</p><p>{sales.length}</p></div>
                  <div><p className="text-xs text-slate-400">Jami xarid</p><p className="font-semibold">{money(sales.reduce((sum, s) => sum + s.items.reduce((lineSum, item) => lineSum + item.miqdor * item.sotuvNarxi, 0), 0))}</p></div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">Qo‘shilgan: {formatDate(c.createdAt)}</p>
                  <div className="flex gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => edit(c)}><Edit3 size={17} /></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(c.id)}><Trash2 size={17} /></button></div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Desktop: condensed table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="table-head"><tr><th className="px-4 py-3">Mijoz</th><th className="px-4 py-3">Xaridlar soni</th><th className="px-4 py-3">Jami xarid</th><th className="px-4 py-3">Qolgan qarz</th><th className="px-4 py-3">Qo‘shilgan sana</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((c) => {
                const sales = data.sales.filter((s) => s.customerId === c.id);
                const debt = data.debts.filter((d) => d.mijozId === c.id).reduce((s, d) => s + d.qolganQarz, 0);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3"><p className="font-semibold">{c.ism}</p><p className="text-xs text-slate-500">{c.telefon}{c.manzil ? ` · ${c.manzil}` : ''}</p></td>
                    <td className="px-4 py-3 whitespace-nowrap">{sales.length}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold">{money(sales.reduce((sum, s) => sum + s.items.reduce((lineSum, item) => lineSum + item.miqdor * item.sotuvNarxi, 0), 0))}</td>
                    <td className={`px-4 py-3 whitespace-nowrap font-semibold ${debt ? 'text-red-600' : 'text-emerald-600'}`}>{money(debt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><button className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={() => edit(c)}><Edit3 size={17} /></button><button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setDeleteId(c.id)}><Trash2 size={17} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState />}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
      <Modal open={open} title={form.id ? 'Mijozni tahrirlash' : 'Yangi mijoz'} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div><label className="label">Mijoz ismi *</label><input className="input" value={form.ism} onChange={(e) => setForm({ ...form, ism: e.target.value })} /></div>
          <div><label className="label">Telefon *</label><input className="input" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} placeholder="+998 90 123 45 67" /></div>
          <div><label className="label">Manzil</label><input className="input" value={form.manzil} onChange={(e) => setForm({ ...form, manzil: e.target.value })} /></div>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Bekor qilish</button><button className="btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={Boolean(deleteId)} message="Savdo yoki qarz tarixi mavjud mijoz o‘chirilmaydi." onClose={() => setDeleteId(null)} onConfirm={remove} loading={deleting} />
    </div>
  );
}
