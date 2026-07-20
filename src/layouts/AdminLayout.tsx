import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useAppStore } from '../store/AppStore';

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { data } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.settings.darkMode);
  }, [data.settings.darkMode]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} collapsed={collapsed} onCollapse={() => setCollapsed((value) => !value)} />
      <div className={`min-h-screen min-w-0 transition-all ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 max-w-full p-3 sm:p-6 lg:p-8"><div className="min-w-0 max-w-full"><Outlet /></div></main>
      </div>
    </div>
  );
}
