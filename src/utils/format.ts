export const formatMoney = (value: number, currency = 'so‘m') =>
  `${new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 }).format(value)} ${currency}`;

export const formatNumber = (value: number) => new Intl.NumberFormat('uz-UZ').format(value);

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
