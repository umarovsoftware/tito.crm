import type { ReactNode } from 'react';

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex min-w-0 flex-col justify-between gap-4 sm:mb-6 sm:flex-row sm:items-center">
      <div className="min-w-0"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p></div>
      {actions && <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:justify-end [&_button]:w-full sm:[&_button]:w-auto">{actions}</div>}
    </div>
  );
}
