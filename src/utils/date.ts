export const toInputDate = (date: Date) => date.toISOString().slice(0, 10);
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
