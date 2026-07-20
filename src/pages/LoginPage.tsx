import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { user, login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;
  const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); setSubmitting(true); try { await login(username, password); navigate('/'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Kirish amalga oshmadi.'); } finally { setSubmitting(false); } };
  return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 dark:bg-slate-950"><form onSubmit={submit} className="card w-full max-w-md space-y-5 p-8"><div><p className="text-sm font-semibold text-blue-600">Aroma House</p><h1 className="mt-1 text-3xl font-bold">Tizimga kirish</h1><p className="mt-2 text-sm text-slate-500">CRM boshqaruv paneliga kiring.</p></div>{error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<label className="block"><span className="label">Login</span><input className="input" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label><label className="block"><span className="label">Parol</span><input className="input" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="btn-primary w-full justify-center" disabled={submitting}>{submitting ? 'Kirilmoqda...' : 'Kirish'}</button></form></main>;
}
