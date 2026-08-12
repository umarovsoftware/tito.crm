import { Moon, Save, Sun, UserRound } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useToast } from '../components/Toast';
import { useAppStore } from '../store/AppStore';
import { useAuth } from '../auth/AuthContext';
import { usePermissions } from '../auth/roles';
import type { AppSettings } from '../types';

const initialProfile = { ism: '', familiya: '', email: '', parol: '' };

export function SettingsPage() {
  const { data, updateSettings } = useAppStore();
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { can } = usePermissions();
  const canEdit = can('settings', 'change');
  const [form, setForm] = useState<AppSettings>(data.settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(data.settings), [data.settings]);

  const [profileForm, setProfileForm] = useState(initialProfile);
  const [profileSaving, setProfileSaving] = useState(false);
  useEffect(() => setProfileForm({ ism: user?.first_name ?? '', familiya: user?.last_name ?? '', email: user?.email ?? '', parol: '' }), [user]);

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profileForm.ism.trim()) return showToast('Ismni kiriting.', 'warning');
    if (profileForm.parol && profileForm.parol.trim().length < 8) return showToast('Parol kamida 8 belgidan iborat bo‘lishi kerak.', 'warning');
    setProfileSaving(true);
    const { parol, ...rest } = profileForm;
    const result = await updateProfile(parol.trim() ? { ...rest, parol: parol.trim() } : rest);
    setProfileSaving(false);
    if (!result.ok) return showToast(result.message, 'error');
    setProfileForm((current) => ({ ...current, parol: '' }));
    showToast('Profil ma’lumotlari yangilandi.');
  };

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
    if (!canEdit) return;
    const next = { ...form, darkMode: !form.darkMode };
    setForm(next);
    const result = await updateSettings(next);
    if (!result.ok) { setForm(form); showToast(result.message, 'error'); }
  };

  return (
    <div>
      <PageHeader title="Sozlamalar" description={canEdit ? 'Do‘kon ma’lumotlari va interfeys ko‘rinishini boshqarish.' : 'Do‘kon ma’lumotlari (faqat ko‘rish).'} />
      <form onSubmit={submitProfile} className="card mb-6 p-6">
        <div className="flex items-center gap-2"><UserRound className="text-blue-600" size={20} /><h2 className="text-lg font-bold">Mening profilim</h2></div>
        <p className="mt-1 text-sm text-slate-500">Shaxsiy ma’lumotlaringiz va parolingizni bu yerdan o‘zgartirasiz.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><label className="label">Ism *</label><input className="input" value={profileForm.ism} onChange={(e) => setProfileForm({ ...profileForm, ism: e.target.value })} /></div>
          <div><label className="label">Familiya</label><input className="input" value={profileForm.familiya} onChange={(e) => setProfileForm({ ...profileForm, familiya: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></div>
          <div><label className="label">Yangi parol</label><input className="input" type="password" value={profileForm.parol} onChange={(e) => setProfileForm({ ...profileForm, parol: e.target.value })} placeholder="O‘zgartirmaslik uchun bo‘sh qoldiring" /></div>
        </div>
        <div className="mt-6 flex justify-end"><button className="btn-primary" disabled={profileSaving}><Save size={18} /> {profileSaving ? 'Saqlanmoqda...' : 'Profilni saqlash'}</button></div>
      </form>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <form onSubmit={submit} className="card p-6">
          <h2 className="text-lg font-bold">Do‘kon ma’lumotlari</h2>
          <fieldset disabled={!canEdit} className="contents">
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div><label className="label">Do‘kon nomi *</label><input className="input" value={form.dokonNomi} onChange={(e) => setForm({ ...form, dokonNomi: e.target.value })} /></div>
              <div><label className="label">Telefon</label><input className="input" value={form.telefon} onChange={(e) => setForm({ ...form, telefon: e.target.value })} /></div>
              <div><label className="label">Manzil</label><input className="input" value={form.manzil} onChange={(e) => setForm({ ...form, manzil: e.target.value })} /></div>
              <div><label className="label">Valyuta</label><select className="input" value={form.valyuta} onChange={(e) => setForm({ ...form, valyuta: e.target.value })}><option>so‘m</option><option>USD</option></select></div>
            </div>
            {canEdit && <div className="mt-6 flex justify-end"><button className="btn-primary" disabled={saving}><Save size={18} /> {saving ? 'Saqlanmoqda...' : 'Sozlamalarni saqlash'}</button></div>}
          </fieldset>
        </form>
        <div className="card p-6">
          <h2 className="text-lg font-bold">Interfeys ko‘rinishi</h2>
          <p className="mt-1 text-sm text-slate-500">Yorug‘ yoki tungi rejimni tanlang.</p>
          <button onClick={toggleDarkMode} disabled={!canEdit} className="mt-5 flex w-full items-center justify-between rounded-2xl border p-4 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800">
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
