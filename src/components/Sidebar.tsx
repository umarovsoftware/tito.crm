import { BarChart3, Boxes, ChevronLeft, CircleDollarSign, CreditCard, History, LayoutDashboard, PackagePlus, ReceiptText, Settings, ShoppingCart, UserCog, Users, WalletCards, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/AppStore';
import { useAuth } from '../auth/AuthContext';
import { can, type Module } from '../auth/roles';

const homeItem = { label: 'Dashboard', path: '/', icon: LayoutDashboard, module: 'dashboard' as Module };
const cashierHomeItem = { label: 'Sotuv bo‘limi', path: '/sotuv-bolimi', icon: ShoppingCart, module: 'sales' as Module };
const warehouseHomeItem = { label: 'Ombor xonasi', path: '/ombor-xonasi', icon: PackagePlus, module: 'warehouse' as Module };

const items: { label: string; path: string; icon: typeof Boxes; module: Module }[] = [
  { label: 'Parfyumlar', path: '/parfyumlar', icon: Boxes, module: 'perfumes' },
  { label: 'Sotuvlar', path: '/sotuvlar', icon: ShoppingCart, module: 'sales' },
  { label: 'Kirimlar', path: '/kirimlar', icon: WalletCards, module: 'incomes' },
  { label: 'Chiqimlar', path: '/chiqimlar', icon: ReceiptText, module: 'expenses' },
  { label: 'Mijozlar', path: '/mijozlar', icon: Users, module: 'customers' },
  { label: 'Qarzdorlar', path: '/qarzdorlar', icon: CircleDollarSign, module: 'debts' },
  { label: 'Qarzlarim', path: '/qarzlarim', icon: CreditCard, module: 'payables' },
  { label: 'Hisobotlar', path: '/hisobotlar', icon: BarChart3, module: 'reports' },
  { label: 'Ombor', path: '/ombor', icon: PackagePlus, module: 'warehouse' },
  { label: 'Sozlamalar', path: '/sozlamalar', icon: Settings, module: 'settings' },
];

const adminItems: { label: string; path: string; icon: typeof UserCog; module: Module }[] = [
  { label: 'Hodimlar', path: '/hodimlar', icon: UserCog, module: 'employees' },
  { label: 'Loglar', path: '/loglar', icon: History, module: 'activity_logs' },
];

export function Sidebar({ mobileOpen, onMobileClose, collapsed, onCollapse }: { mobileOpen: boolean; onMobileClose: () => void; collapsed: boolean; onCollapse: () => void }) {
  const { data } = useAppStore();
  const { user } = useAuth();
  const home = user?.role === 'cashier' ? cashierHomeItem : user?.role === 'warehouse' ? warehouseHomeItem : homeItem;
  const navItems = [home, ...items, ...adminItems].filter((item) => can(user, item.module, 'view'));
  return (
    <>
      {mobileOpen && <button aria-label="Sidebarni yopish" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={onMobileClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white transition-all dark:bg-slate-900 ${collapsed ? 'w-20' : 'w-72'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-20 items-center justify-between border-b px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white">{(data.settings.dokonNomi?.[0] ?? 'A').toUpperCase()}</div>
            {!collapsed && <div className="min-w-0"><p className="truncate font-bold">{data.settings.dokonNomi}</p><p className="text-xs text-slate-500">Parfyum boshqaruvi</p></div>}
          </div>
          <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" onClick={onMobileClose}><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={onMobileClose} title={collapsed ? label : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'} ${collapsed ? 'justify-center' : ''}`}>
              <Icon size={20} />{!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3">
          <button onClick={onCollapse} className="hidden w-full items-center justify-center rounded-xl border p-2.5 text-slate-500 hover:bg-slate-50 lg:flex dark:hover:bg-slate-800"><ChevronLeft className={`transition ${collapsed ? 'rotate-180' : ''}`} size={19} /></button>
        </div>
      </aside>
    </>
  );
}
