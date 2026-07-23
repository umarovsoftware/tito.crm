import { Moon, Save, Sun } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import type { AppSettings } from '../types';

export function SettingsPage() {
  const { data, updateSettings } = useAppStore();
  const { showToast } = useToast();
  const [form, setForm] = useState<AppSettings>(data.settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(data.settings), [data.settings]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.dokonNomi.trim()) return showToast('Do‘kon nomini kiriting.', 'warning');
    setSaving(true);
    const result = await updateSettings(form);
    setSaving(false);
    if (!result.ok) return showToast(result.message, 'error');
    showToast('Sozlamalar saqlandi.');
  };

  const toggleDarkMode = async () => {
    const next = { ...form, darkMode: !form.darkMode };
    setForm(next);
    const result = await updateSettings(next);
    if (!result.ok) { setForm(form); showToast(result.message, 'error'); }
  };

  return (
    <div>
      <PageHeader title="Sozlamalar" description="Do‘kon ma’lumotlari va interfeys ko‘rinishini boshqarish." />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <form onSubmit={submit} className="card p-6">
          <h2 className="text-lg font-bold">Do‘kon ma’lumotlari</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><label className="label">Do‘kon nomi *</label><input className="input" value={form.dokonNomi} onChange={(e) => setForm({ ...form, dokonNomi: e.target.value })} /></div>
            <div><label className="label">Telefon</label><input className="input" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} /></div>
            <div><label className="label">Manzil</label><input className="input" value={form.manzil} onChange={(e) => setForm({ ...form, manzil: e.target.value })} /></div>
            <div><label className="label">Valyuta</label><select className="input" value={form.valyuta} onChange={(e) => setForm({ ...form, valyuta: e.target.value })}><option>so‘m</option><option>USD</option></select></div>
          </div>
          <div className="mt-6 flex justify-end"><button className="btn-primary" disabled={saving}><Save size={18} /> {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}</button></div>
        </form>
        <div className="card p-6">
          <h2 className="text-lg font-bold">Interfeys ko‘rinishi</h2>
          <p className="mt-1 text-sm text-slate-500">Yorug‘ yoki tungi rejimni tanlang.</p>
          <button onClick={toggleDarkMode} className="mt-5 flex w-full items-center justify-between rounded-2xl border p-4 hover:bg-slate-50 dark:hover:bg-slate-800">
            <div className="flex items-center gap-3">
              {form.darkMode ? <Moon className="text-blue-500" /> : <Sun className="text-amber-500" />}
              <div className="text-left"><p className="font-semibold">{form.darkMode ? 'Tungi rejim' : 'Yorug‘ rejim'}</p><p className="text-xs text-slate-500">Darhol qo‘llanadi</p></div>
            </div>
            <span className={`relative h-7 w-12 rounded-full ${form.darkMode ? 'bg-blue-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${form.darkMode ? 'left-6' : 'left-1'}`} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
