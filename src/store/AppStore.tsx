import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ActivityLog, AppData, AppSettings, Customer, Employee, Expense, ExpenseCategory, Income, PayableDebt, Perfume, Sale, StockIn } from '../types';
import { useAuth } from '../auth/AuthContext';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://68.183.16.36/api').replace(/\/$/, '');
const emptyData: AppData = {
  perfumes: [], customers: [], stockIns: [], sales: [], debts: [], payables: [], incomes: [], expenses: [],
  settings: { dokonNomi: 'Aroma House', telefon: '', manzil: '', valyuta: "so'm", darkMode: false },
  employees: [], activityLogs: [],
};

export type ActionResult = { ok: true } | { ok: false; message: string };
type AsyncAction = Promise<ActionResult>;
type PerfumeInput = Omit<Perfume, 'id' | 'createdAt'> & { id?: string };
type CustomerInput = Omit<Customer, 'id' | 'createdAt'> & { id?: string };
type StockInput = Omit<StockIn, 'id' | 'createdAt'> & { id?: string };
type SaleInput = Omit<Sale, 'id' | 'createdAt' | 'sotuvKodi' | 'xaridorKodi' | 'jamiSumma'> & { id?: string };
type IncomeInput = Omit<Income, 'id' | 'createdAt' | 'sourceId'> & { id?: string };
type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'sourceId'> & { id?: string };
type PayableInput = { id?: string; yetkazibBeruvchi: string; telefon: string; kategoriya: ExpenseCategory; jamiQarz: number; muddat: string; izoh: string; sana: string };
type EmployeeInput = { id?: number; username: string; ism: string; familiya: string; email: string; faol: boolean; parol?: string };

interface AppStoreValue {
  data: AppData;
  loading: boolean;
  reload: () => Promise<void>;
  savePerfume: (input: PerfumeInput) => AsyncAction;
  deletePerfume: (id: string) => AsyncAction;
  saveCustomer: (input: CustomerInput) => AsyncAction;
  deleteCustomer: (id: string) => AsyncAction;
  saveStockIn: (input: StockInput) => AsyncAction;
  deleteStockIn: (id: string) => AsyncAction;
  saveSale: (input: SaleInput) => AsyncAction;
  deleteSale: (id: string) => AsyncAction;
  addDebtPayment: (debtId: string, amount: number, date: string, note: string) => AsyncAction;
  updateDebt: (id: string, muddat: string) => AsyncAction;
  savePayable: (input: PayableInput) => AsyncAction;
  deletePayable: (id: string) => AsyncAction;
  addPayablePayment: (payableId: string, amount: number, date: string, note: string) => AsyncAction;
  saveIncome: (input: IncomeInput) => AsyncAction;
  deleteIncome: (id: string) => AsyncAction;
  saveExpense: (input: ExpenseInput) => AsyncAction;
  deleteExpense: (id: string) => AsyncAction;
  updateSettings: (settings: AppSettings) => AsyncAction;
  saveEmployee: (input: EmployeeInput) => AsyncAction;
  deleteEmployee: (id: number) => AsyncAction;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

async function request<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const access = localStorage.getItem('tito_access_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(access ? { Authorization: `Bearer ${access}` } : {}), ...(init?.headers ?? {}) },
  });
  if (response.status === 401 && !retried && localStorage.getItem('tito_refresh_token')) {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: localStorage.getItem('tito_refresh_token') }) });
    if (refreshResponse.ok) {
      const tokens = await refreshResponse.json() as { access: string; refresh?: string };
      localStorage.setItem('tito_access_token', tokens.access);
      if (tokens.refresh) localStorage.setItem('tito_refresh_token', tokens.refresh);
      return request<T>(path, init, true);
    }
  }
  if (response.status === 204) return undefined as T;
  const body: unknown = await response.json();
  if (!response.ok) {
    const record = body as Record<string, unknown>;
    const firstError = Object.values(record)[0];
    const message = typeof record.detail === 'string' ? record.detail : Array.isArray(firstError) ? String(firstError[0]) : typeof firstError === 'string' ? firstError : 'So‘rovni bajarib bo‘lmadi.';
    throw new Error(message);
  }
  return body as T;
}

const withoutId = <T extends { id?: string }>(item: T) => {
  const { id: _id, ...payload } = item;
  return payload;
};

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const isSuperAdmin = Boolean(user?.is_superuser);
    const [perfumes, customers, stockIns, sales, debts, payables, incomes, expenses, settings, employees, activityLogs] = await Promise.all([
      request<Perfume[]>('/perfumes/'), request<Customer[]>('/customers/'), request<StockIn[]>('/stock-ins/'),
      request<Sale[]>('/sales/'), request<AppData['debts']>('/debts/'), request<PayableDebt[]>('/payables/'),
      request<Income[]>('/incomes/'), request<Expense[]>('/expenses/'), request<AppSettings>('/settings/'),
      isSuperAdmin ? request<Employee[]>('/employees/') : Promise.resolve([]),
      isSuperAdmin ? request<ActivityLog[]>('/activity-logs/') : Promise.resolve([]),
    ]);
    setData({ perfumes, customers, stockIns, sales, debts, payables, incomes, expenses, settings, employees, activityLogs });
  }, [user]);

  useEffect(() => {
    if (!user) { setData(emptyData); setLoading(false); return; }
    setLoading(true);
    reload().catch((error: unknown) => console.error('API yuklanmadi:', error)).finally(() => setLoading(false));
  }, [reload, user]);

  const run = useCallback((work: () => Promise<unknown>): AsyncAction => {
    return work().then(async () => { await reload(); return { ok: true } as ActionResult; }).catch((error: unknown) => ({ ok: false, message: error instanceof Error ? error.message : 'Xatolik yuz berdi.' } as ActionResult));
  }, [reload]);
  const save = <T extends { id?: string }>(path: string, input: T) => run(() => request(input.id ? `${path}${input.id}/` : path, { method: input.id ? 'PUT' : 'POST', body: JSON.stringify(withoutId(input)) }));
  const remove = (path: string, id: string) => run(() => request(`${path}${id}/`, { method: 'DELETE' }));

  const value = useMemo<AppStoreValue>(() => ({
    data, loading, reload,
    savePerfume: (input) => save('/perfumes/', input), deletePerfume: (id) => remove('/perfumes/', id),
    saveCustomer: (input) => save('/customers/', input), deleteCustomer: (id) => remove('/customers/', id),
    saveStockIn: (input) => save('/stock-ins/', input), deleteStockIn: (id) => remove('/stock-ins/', id),
    saveSale: (input) => save('/sales/', input), deleteSale: (id) => remove('/sales/', id),
    addDebtPayment: (id, amount, sana, izoh) => run(() => request(`/debts/${id}/payment/`, { method: 'POST', body: JSON.stringify({ summa: amount, sana, izoh }) })),
    updateDebt: (id, muddat) => run(() => request(`/debts/${id}/`, { method: 'PATCH', body: JSON.stringify({ muddat }) })),
    savePayable: (input) => save('/payables/', input), deletePayable: (id) => remove('/payables/', id),
    addPayablePayment: (id, amount, sana, izoh) => run(() => request(`/payables/${id}/payment/`, { method: 'POST', body: JSON.stringify({ summa: amount, sana, izoh }) })),
    saveIncome: (input) => save('/incomes/', input), deleteIncome: (id) => remove('/incomes/', id),
    saveExpense: (input) => save('/expenses/', input), deleteExpense: (id) => remove('/expenses/', id),
    updateSettings: (settings) => run(() => request('/settings/', { method: 'PUT', body: JSON.stringify(settings) })),
    saveEmployee: (input) => run(() => { const { id, ...payload } = input; return request(id ? `/employees/${id}/` : '/employees/', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); }),
    deleteEmployee: (id) => remove('/employees/', String(id)),
  }), [data, loading, reload, run]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('useAppStore AppStoreProvider ichida ishlatilishi kerak');
  return context;
}
