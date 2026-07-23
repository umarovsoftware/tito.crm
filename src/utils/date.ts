const pad = (value: number) => String(value).padStart(2, '0');
export const toInputDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
export const today = () => toInputDate(new Date());

export const daysAgo = (days: number) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return toInputDate(date);
};

export const isInRange = (date: string, start: string, end: string) => date >= start && date <= end;

export const getPresetRange = (preset: 'today' | 'week' | 'month') => {
  const end = today();
  const date = new Date();
  if (preset === 'week') date.setDate(date.getDate() - 6);
  if (preset === 'month') date.setDate(date.getDate() - 29);
  return { start: preset === 'today' ? end : toInputDate(date), end };
};
