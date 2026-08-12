import type { Role } from '../types';
import { useAuth, type AuthUser } from './AuthContext';

export type Module = 'dashboard' | 'perfumes' | 'stock_ins' | 'sales' | 'customers' | 'debts' | 'payables' | 'incomes' | 'expenses' | 'reports' | 'warehouse' | 'settings' | 'employees' | 'activity_logs';
export type Capability = 'view' | 'add' | 'change' | 'delete';

const FULL: Capability[] = ['view', 'add', 'change', 'delete'];
const READ_ONLY: Capability[] = ['view'];
const NONE: Capability[] = [];

const MODULES: Module[] = ['dashboard', 'perfumes', 'stock_ins', 'sales', 'customers', 'debts', 'payables', 'incomes', 'expenses', 'reports', 'warehouse', 'settings'];

/** Mirrors backend/store/roles.py — keep in sync. The backend copy is the real security boundary; this one only drives nav/UI. */
export const ROLE_PERMISSIONS: Record<Role, Record<Module, Capability[]>> = {
  manager: Object.fromEntries(MODULES.map((m) => [m, FULL])) as Record<Module, Capability[]>,
  accountant: {
    dashboard: READ_ONLY, perfumes: READ_ONLY, stock_ins: READ_ONLY, sales: READ_ONLY,
    customers: READ_ONLY, debts: FULL, payables: FULL, incomes: FULL, expenses: FULL,
    reports: READ_ONLY, warehouse: READ_ONLY, settings: READ_ONLY, employees: NONE, activity_logs: NONE,
  },
  warehouse: {
    dashboard: NONE, perfumes: FULL, stock_ins: FULL, sales: READ_ONLY,
    customers: NONE, debts: NONE, payables: NONE, incomes: NONE, expenses: NONE,
    reports: READ_ONLY, warehouse: FULL, settings: READ_ONLY, employees: NONE, activity_logs: NONE,
  },
  cashier: {
    dashboard: NONE, perfumes: READ_ONLY, stock_ins: NONE, sales: ['view', 'add', 'change'],
    customers: ['view', 'add', 'change'], debts: ['view', 'change'], payables: NONE, incomes: NONE, expenses: NONE,
    reports: NONE, warehouse: NONE, settings: READ_ONLY, employees: NONE, activity_logs: NONE,
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  manager: 'Menejer',
  accountant: 'Buxgalter',
  warehouse: "Ombor mas'uli",
  cashier: 'Sotuvchi',
};

export function can(user: AuthUser | null, module: Module, capability: Capability): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  if (!user.role) return false;
  return ROLE_PERMISSIONS[user.role]?.[module]?.includes(capability) ?? false;
}

/** Where a role should land after login instead of the shared financial Dashboard. */
export function homePathFor(user: AuthUser | null): string {
  if (user?.role === 'cashier') return '/sotuv-bolimi';
  if (user?.role === 'warehouse') return '/ombor-xonasi';
  return '/';
}

export function usePermissions() {
  const { user } = useAuth();
  return { can: (module: Module, capability: Capability) => can(user, module, capability), role: user?.role ?? null, isSuperAdmin: Boolean(user?.is_superuser) };
}
