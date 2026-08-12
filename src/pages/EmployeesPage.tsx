import { Edit3, Eye, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import { ROLE_LABELS } from '../auth/roles';
import type { Employee, Role } from '../types';
import { formatDate } from '../utils/format';

const initial = { username: '', ism: '', familiya: '', email: '', faol: true, parol: '', rol: 'cashier' as Role };
type FormState = typeof initial & { id?: number };
const pageSize = 8;

export function EmployeesPage() {
  const { data, saveEmployee, deleteEmployee } = useAppStore();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState>(initial);
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => data.employees.filter((item) => `${item.username} ${item.ism} ${item.familiya} ${item.email}`.toLowerCase().includes(query.toLowerCase())), [data.employees, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const startAdd = () => { setForm(initial); setOpen(true); };
  const edit = (item: Employee) => { setForm({ id: item.id, username: item.username, ism: item.ism, familiya: item.familiya, email: item.email, faol: item.faol, rol: item.rol, parol: '' }); setOpen(true); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.username.trim() || !form.ism.trim()) return showToast('Login va ismni kiriting.', 'warning');
    if (!form.id && form.parol.trim().length < 8) return showToast('Parol kamida 8 belgidan iborat bo‘lishi kerak.', 'warning');
    setSaving(true);
    const { parol, ...rest } = form;
    const payload = parol.trim() ? { ...rest, parol: parol.trim() } : rest;
    const result = await saveEmployee(payload);
    setSaving(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast(form.id ? 'Hodim ma’lumotlari yangilandi.' : 'Yangi hodim qo‘shildi.');
    setOpen(false);
    setForm(initial);
  };

  const remove = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const result = await deleteEmployee(deleteId);
    setDeleting(false);
    showToast(result.ok ? 'Hodim o‘chirildi.' : result.message, result.ok ? 'success' : 'error');
    setDeleteId(null);
  };

  return (
    <div>
      <PageHeader title="Hodimlar" description="Hodimlar uchun login va parol yarating — har bir hodimning amallari Loglar bo‘limida kuzatiladi." actions={<button className="btn-primary" onClick={startAdd}><Plus size={18} /> Hodim qo‘shish</button>} />
      <div className="card mb-4 p-4"><label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 self-start" size={18} /><input className="input pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Login, ism yoki email..." /></label></div>
      <div className="card overflow-hidden">
        {/* Mobile: card list */}
        <div className="divide-y lg:hidden">
          {rows.map((item) => (
            <div key={item.id} className="cursor-pointer p-4" onClick={() => navigate(`/hodimlar/${item.id}`)}>
              <div className="flex items-start justify-between gap-2">
                <div><p className="font-semibold">{item.ism} {item.familiya}</p><p className="font-mono text-xs text-slate-500">{item.username}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.faol ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{item.faol ? 'Faol' : 'Nofaol'}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{ROLE_LABELS[item.rol]} · {item.email || 'Email kiritilmagan'} · Qo‘shilgan: {formatDate(item.createdAt)}</p>
              <div className="mt-3 flex justify-end gap-1">
                <button title="Tahrirlash" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); edit(item); }}><Edit3 size={17} /></button>
                <button title="O‘chirish" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 size={17} /></button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop: condensed table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-sm">
            <thead className="table-head"><tr><th className="px-4 py-3">Hodim</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Holat</th><th className="px-4 py-3">Qo‘shilgan sana</th><th className="px-4 py-3 text-right">Amallar</th></tr></thead>
            <tbody className="divide-y">
              {rows.map((item) => (
                <tr key={item.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40" onClick={() => navigate(`/hodimlar/${item.id}`)}>
                  <td className="px-4 py-3"><p className="font-semibold">{item.ism} {item.familiya}</p><p className="font-mono text-xs text-slate-500">{item.username}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap">{ROLE_LABELS[item.rol]}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.email || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.faol ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{item.faol ? 'Faol' : 'Nofaol'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button title="Dashboard va amallarni ko‘rish" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={(e) => { e.stopPropagation(); navigate(`/hodimlar/${item.id}`); }}><Eye size={17} /></button>
                      <button title="Tahrirlash" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); edit(item); }}><Edit3 size={17} /></button>
                      <button title="O‘chirish" className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); setDeleteId(item.id); }}><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <EmptyState text="Hodimlar topilmadi" />}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
      <Modal open={open} title={form.id ? 'Hodimni tahrirlash' : 'Yangi hodim'} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Ism *</label><input className="input" value={form.ism} onChange={(e) => setForm({ ...form, ism: e.target.value })} /></div>
            <div><label className="label">Familiya</label><input className="input" value={form.familiya} onChange={(e) => setForm({ ...form, familiya: e.target.value })} /></div>
          </div>
          <div><label className="label">Login (username) *</label><input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={Boolean(form.id)} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Rol *</label><select className="input" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Role })}>{Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="label">{form.id ? 'Yangi parol (ixtiyoriy)' : 'Parol *'}</label><input className="input" type="password" value={form.parol} onChange={(e) => setForm({ ...form, parol: e.target.value })} placeholder={form.id ? 'O‘zgartirmaslik uchun bo‘sh qoldiring' : 'Kamida 8 belgi'} /></div>
          <label className="flex items-center gap-3"><input type="checkbox" checked={form.faol} onChange={(e) => setForm({ ...form, faol: e.target.checked })} /><span>Faol (tizimga kira oladi)</span></label>
          <div className="flex justify-end gap-3"><button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Bekor qilish</button><button className="btn-primary" disabled={saving}>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={Boolean(deleteId)} title="Hodimni o‘chirish" message="Hodim hisobi o‘chiriladi, ammo uning avvalgi amallari Loglar bo‘limida saqlanib qoladi." onClose={() => setDeleteId(null)} onConfirm={remove} loading={deleting} />
    </div>
  );
}
