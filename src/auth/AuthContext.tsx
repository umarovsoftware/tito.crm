import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api').replace(/\/$/, '');
export type AuthUser = { id: number; username: string; first_name: string; last_name: string; email: string; is_staff?: boolean };
type AuthContextValue = { user: AuthUser | null; login: (username: string, password: string) => Promise<void>; logout: () => Promise<void> };
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
  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak'); return context; }
