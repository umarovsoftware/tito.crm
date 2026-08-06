import type { Sale, SaleItem, SaleType } from '../types';
import { today } from './date';
import type { NumberInputValue } from './numberInput';

export type SaleFormItem = Omit<SaleItem, 'miqdor' | 'sotuvNarxi'> & {
  miqdor: NumberInputValue;
  sotuvNarxi: NumberInputValue;
};

export type SaleFormState = Omit<Sale, 'id' | 'createdAt' | 'sotuvKodi' | 'xaridorKodi' | 'jamiSumma' | 'items'> & {
  id?: string;
  sotuvKodi?: string;
  xaridorKodi?: string;
  items: SaleFormItem[];
};

export const createInitialSale = (saleTuri: SaleType = 'Doimiy mijoz'): SaleFormState => ({
  saleTuri, customerId: '', xaridorKodi: '', items: [], tolovTuri: 'Naqd', ulgurjiSavdo: false,
  yetkazibBerish: false, yetkazibBerishManzili: '', sana: today(),
});

export const getSaleCode = (sale: Sale) => sale.sotuvKodi || sale.id;
export const getGuestCode = (sale: Sale) => sale.xaridorKodi || `TX-${sale.id.slice(-8).toUpperCase()}`;
export const saleTotal = (sale: Pick<Sale, 'items' | 'jamiSumma'>) => Number(sale.jamiSumma ?? sale.items.reduce((sum, item) => sum + item.miqdor * item.sotuvNarxi, 0));
