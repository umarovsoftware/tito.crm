import { Menu, Moon, Search, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAppStore } from '../store/AppStore';

export function Header({ onMenu }: { onMenu: () => void }) {
  const { data, updateSettings } = useAppStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const submit = (event: React.FormEvent) => { event.preventDefault(); navigate(`/parfyumlar?q=${encodeURIComponent(query)}`); };
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8 dark:bg-slate-900/90">
      <button className="rounded-xl border p-2.5 lg:hidden" onClick={onMenu}><Menu size={20} /></button>
      <form onSubmit={submit} className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-10" placeholder="Parfyum yoki barcode qidirish..." />
      </form>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={() => updateSettings({ ...data.settings, darkMode: !data.settings.darkMode })} className="rounded-xl border p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800" title="Tungi rejim">{data.settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
        <div className="hidden text-right sm:block"><p className="text-sm font-semibold">Administrator</p><p className="text-xs text-slate-500">Boshqaruv paneli</p></div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">AD</div>
      </div>
    </header>
  );
}
