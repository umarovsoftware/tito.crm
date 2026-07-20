import { BarChart3, Boxes, ChevronLeft, CircleDollarSign, CreditCard, LayoutDashboard, PackagePlus, ReceiptText, Settings, ShoppingCart, Users, WalletCards, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/AppStore';

const items = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Parfyumlar', path: '/parfyumlar', icon: Boxes },
  { label: 'Sotuvlar', path: '/sotuvlar', icon: ShoppingCart },
  { label: 'Kirimlar', path: '/kirimlar', icon: WalletCards },
  { label: 'Chiqimlar', path: '/chiqimlar', icon: ReceiptText },
  { label: 'Mijozlar', path: '/mijozlar', icon: Users },
  { label: 'Qarzdorlar', path: '/qarzdorlar', icon: CircleDollarSign },
  { label: 'Qarzlarim', path: '/qarzlarim', icon: CreditCard },
  { label: 'Hisobotlar', path: '/hisobotlar', icon: BarChart3 },
  { label: 'Ombor', path: '/ombor', icon: PackagePlus },
  { label: 'Sozlamalar', path: '/sozlamalar', icon: Settings },
];

export function Sidebar({ mobileOpen, onMobileClose, collapsed, onCollapse }: { mobileOpen: boolean; onMobileClose: () => void; collapsed: boolean; onCollapse: () => void }) {
  const { data } = useAppStore();
  return (
    <>
      {mobileOpen && <button aria-label="Sidebarni yopish" className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={onMobileClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[86vw] flex-col border-r bg-white transition-all dark:bg-slate-900 ${collapsed ? 'lg:w-20' : 'lg:w-72'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex h-20 items-center justify-between border-b px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-lg font-black text-white">T</div>
            <div className={`min-w-0 ${collapsed ? 'lg:hidden' : ''}`}><p className="truncate font-bold">{data.settings.dokonNomi}</p><p className="truncate text-xs text-slate-500">Parfyum boshqaruvi</p></div>
          </div>
          <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800" onClick={onMobileClose}><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} end={path === '/'} onClick={onMobileClose} title={collapsed ? label : undefined} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'} ${collapsed ? 'lg:justify-center' : ''}`}>
              <Icon className="shrink-0" size={20} /><span className={`min-w-0 truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
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
