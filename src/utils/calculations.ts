import type { DebtStatus, Expense, Income, Perfume, Sale } from '../types';
import { isInRange } from './date';

export const purchaseTotal = (product: Perfume) => product.qoldiq * product.kelishNarxi;
export const salesTotal = (product: Perfume) => product.qoldiq * product.sotuvNarxi;
export const expectedProfit = (product: Perfume) => salesTotal(product) - purchaseTotal(product);
export const remainingDebt = (total: number, paid: number) => Math.max(0, total - paid);
export const netCashFlow = (incomes: number, expenses: number) => incomes - expenses;

export const sumByRange = <T extends { sana: string; summa: number }>(items: T[], start: string, end: string) =>
  items.filter((item) => isInRange(item.sana, start, end)).reduce((sum, item) => sum + item.summa, 0);

export const getDebtStatus = (debt: { jamiQarz: number; tolangan: number; qolganQarz: number; muddat: string }): DebtStatus => {
  if (debt.qolganQarz <= 0) return 'Qarz yopilgan';
  if (debt.muddat < new Date().toISOString().slice(0, 10)) return 'Muddati o‘tgan';
  if (debt.tolangan > 0) return 'Qisman to‘langan';
  return 'Qarzdor';
};

// Uses each line's own frozen kelishNarxi (the product's cost at the moment of sale) so that
// editing a product's price today doesn't retroactively change historical profit reports.
// Falls back to the product's current cost only for old rows created before that field existed.
export const grossProfitForSales = (sales: Sale[], perfumes: Perfume[], start: string, end: string) =>
  sales
    .filter((sale) => isInRange(sale.sana, start, end))
    .reduce((sum, sale) => {
      return sum + sale.items.reduce((lineTotal, line) => {
        const perfume = perfumes.find((item) => item.id === line.perfumeId);
        const cost = line.kelishNarxi ?? perfume?.kelishNarxi ?? 0;
        return lineTotal + line.miqdor * (line.sotuvNarxi - cost);
      }, 0);
    }, 0);

export const operationTotals = (incomes: Income[], expenses: Expense[], start: string, end: string) => ({
  income: sumByRange(incomes, start, end),
  expense: sumByRange(expenses, start, end),
});
