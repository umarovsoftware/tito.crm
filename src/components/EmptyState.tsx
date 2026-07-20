import { PackageOpen } from 'lucide-react';
export function EmptyState({ text = 'Ma’lumot topilmadi' }: { text?: string }) {
  return <div className="flex flex-col items-center justify-center px-4 py-14 text-center text-slate-400"><PackageOpen size={42} strokeWidth={1.5} /><p className="mt-3 text-sm">{text}</p></div>;
}
