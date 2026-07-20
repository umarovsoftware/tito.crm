import { Eye, EyeOff, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setLoading(true);
    try { await login(username, password); navigate('/'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Login yoki parol noto‘g‘ri.'); }
    finally { setLoading(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
    <div className="w-full max-w-[420px]">
      <div className="mb-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-950"><Sparkles size={25} /></div><h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Aroma House</h1><p className="mt-1 text-sm text-slate-500">Boshqaruv paneli</p></div>
      <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-7"><h2 className="text-xl font-semibold text-slate-900 dark:text-white">Tizimga kirish</h2><p className="mt-1.5 text-sm text-slate-500">Davom etish uchun hisobingizga kiring.</p></div>
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</div>}
        <div className="space-y-4"><label className="block"><span className="label">Foydalanuvchi nomi</span><span className="relative block"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="input w-full pl-10" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></span></label><label className="block"><span className="label">Parol</span><span className="relative block"><LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="input w-full pl-10 pr-10" type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label="Parolni ko‘rsatish" onClick={() => setVisible((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label></div>
        <button className="btn-primary mt-6 h-11 w-full" disabled={loading}>{loading ? 'Kirilmoqda...' : 'Kirish'}</button>
      </form>
      <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} Aroma House CRM</p>
    </div>
  </main>;
}
