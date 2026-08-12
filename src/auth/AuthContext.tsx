import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://68-183-16-36.nip.io/api').replace(/\/$/, '');

export type AuthUser = { id: number; username: string; first_name: string; last_name: string; email: string; is_staff?: boolean; is_superuser?: boolean; role?: Role | null };
export type ProfileInput = { ism: string; familiya: string; email: string; parol?: string };
export type ProfileResult = { ok: true } | { ok: false; message: string };
type AuthContextValue = { user: AuthUser | null; login: (username: string, password: string) => Promise<void>; logout: () => Promise<void>; updateProfile: (input: ProfileInput) => Promise<ProfileResult> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => { const raw = localStorage.getItem('tito_user'); return raw ? JSON.parse(raw) as AuthUser : null; });
  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
    const body = await response.json() as { access?: string; refresh?: string; user?: AuthUser; detail?: string };
    if (!response.ok || !body.access || !body.refresh || !body.user) throw new Error(body.detail ?? 'Login yoki parol noto‘g‘ri.');
    localStorage.setItem('tito_access_token', body.access); localStorage.setItem('tito_refresh_token', body.refresh); localStorage.setItem('tito_user', JSON.stringify(body.user)); setUser(body.user);
  };
  const logout = async () => {
    await fetch(`${API_BASE_URL}/auth/logout/`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('tito_access_token') ?? ''}` }, body: JSON.stringify({ refresh: localStorage.getItem('tito_refresh_token') }) }).catch(() => undefined);
    localStorage.removeItem('tito_access_token'); localStorage.removeItem('tito_refresh_token'); localStorage.removeItem('tito_user'); setUser(null);
  };
  const updateProfile = async (input: ProfileInput): Promise<ProfileResult> => {
    const payload: Record<string, string> = { ism: input.ism, familiya: input.familiya, email: input.email };
    if (input.parol) payload.parol = input.parol;
    const response = await fetch(`${API_BASE_URL}/auth/me/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('tito_access_token') ?? ''}` },
      body: JSON.stringify(payload),
    });
    const body = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      const firstError = Object.values(body)[0];
      const message = typeof body.detail === 'string' ? body.detail : Array.isArray(firstError) ? String(firstError[0]) : 'Ma’lumotlarni saqlab bo‘lmadi.';
      return { ok: false, message };
    }
    localStorage.setItem('tito_user', JSON.stringify(body));
    setUser(body as AuthUser);
    return { ok: true };
  };
  const value = useMemo(() => ({ user, login, logout, updateProfile }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak'); return context; }
