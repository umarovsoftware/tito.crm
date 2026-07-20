import { Eye, EyeOff, KeyRound, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setSubmitting(true);
    try { await login(username, password); navigate('/'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Kirish amalga oshmadi.'); }
    finally { setSubmitting(false); }
  };

  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
    <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/30 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-40 -right-20 h-[30rem] w-[30rem] rounded-full bg-indigo-600/20 blur-3xl" />
    <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-blue-950/30 lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[36px] border-white/10" />
        <div className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full border-[45px] border-white/10" />
        <div className="relative"><div className="mb-10 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20"><Sparkles size={22} /></span><span className="text-lg font-bold tracking-wide">AROMA HOUSE</span></div><p className="max-w-sm text-4xl font-bold leading-tight">Biznesingizni bir joydan boshqaring.</p><p className="mt-5 max-w-sm text-sm leading-6 text-blue-100">Savdo, ombor, mijozlar va moliyaviy operatsiyalarni qulay boshqaruv panelida nazorat qiling.</p></div>
        <div className="relative flex items-center gap-3 text-sm text-blue-100"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><KeyRound size={17} /></span><span>Xavfsiz va ishonchli boshqaruv</span></div>
      </section>
      <section className="bg-white p-7 sm:p-12">
        <div className="mb-9 lg:hidden"><div className="flex items-center gap-3 text-blue-700"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50"><Sparkles size={20} /></span><span className="font-bold tracking-wide">AROMA HOUSE</span></div></div>
        <div className="mb-8"><p className="text-sm font-semibold text-blue-600">Xush kelibsiz</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Tizimga kirish</h1><p className="mt-2 text-sm text-slate-500">Boshqaruv paneliga kirish uchun ma’lumotlaringizni kiriting.</p></div>
        {error && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <form onSubmit={submit} className="space-y-5">
          <label className="block"><span className="label">Foydalanuvchi nomi</span><span className="relative block"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input w-full pl-10" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" required /></span></label>
          <label className="block"><span className="label">Parol</span><span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="input w-full pl-10 pr-11" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Parolingizni kiriting" required /><button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Parolni ko‘rsatish">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
          <button className="btn-primary h-12 w-full rounded-xl" disabled={submitting}>{submitting ? 'Kirilmoqda...' : 'Kirish'}</button>
        </form>
        <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Aroma House CRM</p>
      </section>
    </div>
  </main>;
}
