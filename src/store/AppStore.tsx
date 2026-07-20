import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createDemoData } from '../data/demo';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { AppData, AppSettings, Customer, Debt, Expense, ExpenseCategory, Income, PayableDebt, Perfume, Sale, StockIn } from '../types';
import { getDebtStatus, remainingDebt } from '../utils/calculations';

const STORAGE_KEY = 'perfume-admin-data-v1';
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const shortCode = () => crypto.randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase();
const makeSaleCode = (date: string) => `STV-${date.replaceAll('-', '')}-${shortCode()}`;
const makeGuestCode = (date: string) => `TX-${date.replaceAll('-', '')}-${shortCode()}`;

export type ActionResult = { ok: true } | { ok: false; message: string };

type PerfumeInput = Omit<Perfume, 'id' | 'createdAt'> & { id?: string };
type CustomerInput = Omit<Customer, 'id' | 'createdAt'> & { id?: string };
type StockInput = Omit<StockIn, 'id' | 'createdAt'> & { id?: string };
type SaleInput = Omit<Sale, 'id' | 'createdAt'> & { id?: string };
type IncomeInput = Omit<Income, 'id' | 'createdAt' | 'sourceId'> & { id?: string };
type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'sourceId'> & { id?: string };
type PayableInput = { id?: string; yetkazibBeruvchi: string; telefon: string; kategoriya: ExpenseCategory; jamiQarz: number; muddat: string; izoh: string; sana: string };

interface AppStoreValue {
  data: AppData;
  savePerfume: (input: PerfumeInput) => ActionResult;
  deletePerfume: (id: string) => ActionResult;
  saveCustomer: (input: CustomerInput) => ActionResult;
  deleteCustomer: (id: string) => ActionResult;
  saveStockIn: (input: StockInput) => ActionResult;
  deleteStockIn: (id: string) => ActionResult;
  saveSale: (input: SaleInput) => ActionResult;
  deleteSale: (id: string) => ActionResult;
  addDebtPayment: (debtId: string, amount: number, date: string, note: string) => ActionResult;
  updateDebt: (id: string, muddat: string) => ActionResult;
  savePayable: (input: PayableInput) => ActionResult;
  deletePayable: (id: string) => ActionResult;
  addPayablePayment: (payableId: string, amount: number, date: string, note: string) => ActionResult;
  saveIncome: (input: IncomeInput) => ActionResult;
  deleteIncome: (id: string) => ActionResult;
  saveExpense: (input: ExpenseInput) => ActionResult;
  deleteExpense: (id: string) => ActionResult;
  updateSettings: (settings: AppSettings) => void;
  resetDemo: () => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

function normalizeDebt(debt: Debt): Debt {
  const qolganQarz = remainingDebt(debt.jamiQarz, debt.tolangan);
  const next = { ...debt, qolganQarz };
  return { ...next, holat: getDebtStatus(next) };
}

function normalizePayable(payable: PayableDebt): PayableDebt {
  const qolganQarz = remainingDebt(payable.jamiQarz, payable.tolangan);
  const next = { ...payable, qolganQarz };
  return { ...next, holat: getDebtStatus(next) };
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [storedData, setData] = useLocalStorage<AppData>(STORAGE_KEY, createDemoData());
  const data = useMemo<AppData>(() => ({ ...storedData, payables: storedData.payables ?? [] }), [storedData]);

  const savePerfume = (input: PerfumeInput): ActionResult => {
    if (data.perfumes.some((item) => item.barcode === input.barcode && item.id !== input.id)) return { ok: false, message: 'Bu barcode avval kiritilgan.' };
    setData((current) => ({
      ...current,
      perfumes: input.id
        ? current.perfumes.map((item) => (item.id === input.id ? { ...item, ...input } as Perfume : item))
        : [{ ...input, id: uid(), createdAt: now() } as Perfume, ...current.perfumes],
    }));
    return { ok: true };
  };

  const deletePerfume = (id: string): ActionResult => {
    if (data.sales.some((item) => item.perfumeId === id) || data.stockIns.some((item) => item.perfumeId === id)) return { ok: false, message: 'Bu parfyumda operatsiyalar bor. Tarix saqlanishi uchun o‘chirib bo‘lmaydi.' };
    setData((current) => ({ ...current, perfumes: current.perfumes.filter((item) => item.id !== id) }));
    return { ok: true };
  };

  const saveCustomer = (input: CustomerInput): ActionResult => {
    setData((current) => ({
      ...current,
      customers: input.id
        ? current.customers.map((item) => (item.id === input.id ? { ...item, ...input } as Customer : item))
        : [{ ...input, id: uid(), createdAt: now() } as Customer, ...current.customers],
      debts: input.id
        ? current.debts.map((debt) => debt.mijozId === input.id ? { ...debt, mijozNomi: input.ism, telefon: input.telefon } : debt)
        : current.debts,
    }));
    return { ok: true };
  };

  const deleteCustomer = (id: string): ActionResult => {
    if (data.sales.some((item) => item.customerId === id) || data.debts.some((item) => item.mijozId === id)) return { ok: false, message: 'Mijozda savdo yoki qarz tarixi mavjud.' };
    setData((current) => ({ ...current, customers: current.customers.filter((item) => item.id !== id) }));
    return { ok: true };
  };

  const saveStockIn = (input: StockInput): ActionResult => {
    const old = input.id ? data.stockIns.find((item) => item.id === input.id) : undefined;
    const currentOldProduct = old ? data.perfumes.find((item) => item.id === old.perfumeId) : undefined;
    if (old && currentOldProduct && currentOldProduct.qoldiq < old.miqdor) return { ok: false, message: 'Bu kirimni tahrirlash uchun joriy qoldiq yetarli emas.' };
    if (!data.perfumes.some((item) => item.id === input.perfumeId)) return { ok: false, message: 'Parfyum topilmadi.' };

    const id = input.id ?? uid();
    const record: StockIn = { ...input, id, createdAt: old?.createdAt ?? now() };
    setData((current) => {
      let perfumes = current.perfumes;
      if (old) perfumes = perfumes.map((item) => item.id === old.perfumeId ? { ...item, qoldiq: item.qoldiq - old.miqdor } : item);
      perfumes = perfumes.map((item) => item.id === input.perfumeId ? { ...item, qoldiq: item.qoldiq + input.miqdor, kelishNarxi: input.kelishNarxi } : item);
      const expense: Expense = { id: `stock-expense-${id}`, kategoriya: 'Tovar xaridi', summa: input.miqdor * input.kelishNarxi, sana: input.sana, izoh: `${input.yetkazibBeruvchi}dan tovar xaridi`, sourceId: id, createdAt: now() };
      return {
        ...current,
        perfumes,
        stockIns: old ? current.stockIns.map((item) => item.id === id ? record : item) : [record, ...current.stockIns],
        expenses: [expense, ...current.expenses.filter((item) => item.sourceId !== id)],
      };
    });
    return { ok: true };
  };

  const deleteStockIn = (id: string): ActionResult => {
    const item = data.stockIns.find((stock) => stock.id === id);
    if (!item) return { ok: false, message: 'Kirim topilmadi.' };
    const product = data.perfumes.find((perfume) => perfume.id === item.perfumeId);
    if (!product || product.qoldiq < item.miqdor) return { ok: false, message: 'Qoldiq ishlatilgani sababli bu kirimni o‘chirib bo‘lmaydi.' };
    setData((current) => ({
      ...current,
      perfumes: current.perfumes.map((perfume) => perfume.id === item.perfumeId ? { ...perfume, qoldiq: perfume.qoldiq - item.miqdor } : perfume),
      stockIns: current.stockIns.filter((stock) => stock.id !== id),
      expenses: current.expenses.filter((expense) => expense.sourceId !== id),
    }));
    return { ok: true };
  };

  const rollbackSale = (current: AppData, sale: Sale): AppData => {
    let debts = current.debts;
    if (sale.tolovTuri === 'Qarz') {
      debts = debts.map((debt) => {
        if (debt.mijozId !== sale.customerId || !debt.tarix.some((history) => history.id === `sale-debt-${sale.id}`)) return debt;
        const amount = sale.miqdor * sale.sotuvNarxi;
        return normalizeDebt({ ...debt, jamiQarz: Math.max(0, debt.jamiQarz - amount), tolangan: Math.min(debt.tolangan, Math.max(0, debt.jamiQarz - amount)), tarix: debt.tarix.filter((history) => history.id !== `sale-debt-${sale.id}`) });
      }).filter((debt) => debt.jamiQarz > 0);
    }
    return {
      ...current,
      perfumes: current.perfumes.map((perfume) => perfume.id === sale.perfumeId ? { ...perfume, qoldiq: perfume.qoldiq + sale.miqdor } : perfume),
      incomes: current.incomes.filter((income) => income.sourceId !== sale.id),
      debts,
    };
  };

  const saveSale = (input: SaleInput): ActionResult => {
    const old = input.id ? data.sales.find((sale) => sale.id === input.id) : undefined;
    let available = data.perfumes.find((item) => item.id === input.perfumeId)?.qoldiq ?? 0;
    if (old?.perfumeId === input.perfumeId) available += old.miqdor;
    if (input.miqdor > available) return { ok: false, message: `Qoldiq yetarli emas. Mavjud: ${available} dona.` };

    const saleTuri = input.saleTuri ?? 'Doimiy mijoz';
    const isGuestSale = saleTuri === 'Tasodifiy xaridor';
    const customer = isGuestSale ? undefined : data.customers.find((item) => item.id === input.customerId);
    const perfume = data.perfumes.find((item) => item.id === input.perfumeId);

    if (!perfume) return { ok: false, message: 'Parfyum topilmadi.' };
    if (!isGuestSale && !customer) return { ok: false, message: 'Doimiy mijozni tanlang.' };
    if (isGuestSale && input.tolovTuri === 'Qarz') return { ok: false, message: 'Tasodifiy xaridorga qarzga sotuv qilib bo‘lmaydi.' };
    if (!isGuestSale && input.yetkazibBerish && !input.yetkazibBerishManzili.trim()) return { ok: false, message: 'Yetkazib berish manzilini kiriting.' };

    const id = input.id ?? uid();
    const record: Sale = {
      ...input,
      id,
      saleTuri,
      customerId: isGuestSale ? '' : input.customerId,
      sotuvKodi: old?.sotuvKodi || input.sotuvKodi || makeSaleCode(input.sana),
      xaridorKodi: isGuestSale ? (old?.xaridorKodi || input.xaridorKodi || makeGuestCode(input.sana)) : '',
      ulgurjiSavdo: isGuestSale ? false : Boolean(input.ulgurjiSavdo),
      yetkazibBerish: isGuestSale ? false : Boolean(input.yetkazibBerish),
      yetkazibBerishManzili: isGuestSale || !input.yetkazibBerish ? '' : input.yetkazibBerishManzili.trim(),
      createdAt: old?.createdAt ?? now(),
    };

    setData((current) => {
      const next = old ? rollbackSale(current, old) : current;
      let debts = next.debts;
      let incomes = next.incomes;
      const total = record.miqdor * record.sotuvNarxi;
      const buyerLabel = customer?.ism ?? record.xaridorKodi;

      if (record.tolovTuri === 'Qarz' && customer) {
        const active = debts.find((debt) => debt.mijozId === customer.id && debt.holat !== 'Qarz yopilgan');
        const due = new Date(record.sana);
        due.setDate(due.getDate() + 30);
        if (active) {
          debts = debts.map((debt) => debt.id === active.id ? normalizeDebt({ ...debt, jamiQarz: debt.jamiQarz + total, muddat: due.toISOString().slice(0, 10), tarix: [{ id: `sale-debt-${id}`, sana: record.sana, summa: total, izoh: `${perfume.firmaNomi} ${perfume.tovarNomi}`, turi: 'Qarz qo‘shildi' }, ...debt.tarix] }) : debt);
        } else {
          const debt: Debt = normalizeDebt({ id: uid(), mijozId: customer.id, mijozNomi: customer.ism, telefon: customer.telefon, jamiQarz: total, tolangan: 0, qolganQarz: total, muddat: due.toISOString().slice(0, 10), holat: 'Qarzdor', tarix: [{ id: `sale-debt-${id}`, sana: record.sana, summa: total, izoh: `${perfume.firmaNomi} ${perfume.tovarNomi}`, turi: 'Qarz qo‘shildi' }], createdAt: now() });
          debts = [debt, ...debts];
        }
      } else {
        const deliveryText = record.yetkazibBerish ? ' · yetkazib berish bilan' : '';
        incomes = [{ id: `sale-income-${id}`, kategoriya: 'Sotuv', summa: total, sana: record.sana, izoh: `${record.sotuvKodi} · ${buyerLabel} · ${perfume.firmaNomi} ${perfume.tovarNomi}${deliveryText}`, sourceId: id, createdAt: now() }, ...incomes];
      }

      return {
        ...next,
        perfumes: next.perfumes.map((item) => item.id === record.perfumeId ? { ...item, qoldiq: item.qoldiq - record.miqdor } : item),
        sales: old ? current.sales.map((sale) => sale.id === id ? record : sale) : [record, ...current.sales],
        debts,
        incomes,
      };
    });
    return { ok: true };
  };

  const deleteSale = (id: string): ActionResult => {
    const sale = data.sales.find((item) => item.id === id);
    if (!sale) return { ok: false, message: 'Sotuv topilmadi.' };
    setData((current) => ({ ...rollbackSale(current, sale), sales: current.sales.filter((item) => item.id !== id) }));
    return { ok: true };
  };

  const addDebtPayment = (debtId: string, amount: number, date: string, note: string): ActionResult => {
    const debt = data.debts.find((item) => item.id === debtId);
    if (!debt) return { ok: false, message: 'Qarz topilmadi.' };
    if (amount <= 0 || amount > debt.qolganQarz) return { ok: false, message: `To‘lov 1 dan ${debt.qolganQarz} gacha bo‘lishi kerak.` };
    const historyId = uid();
    setData((current) => ({
      ...current,
      debts: current.debts.map((item) => item.id === debtId ? normalizeDebt({ ...item, tolangan: item.tolangan + amount, tarix: [{ id: historyId, sana: date, summa: amount, izoh: note || 'Qarz to‘lovi', turi: 'To‘lov' }, ...item.tarix] }) : item),
      incomes: [{ id: uid(), kategoriya: 'Qarz to‘lovi', summa: amount, sana: date, izoh: `${debt.mijozNomi}: ${note || 'qarz to‘lovi'}`, sourceId: historyId, createdAt: now() }, ...current.incomes],
    }));
    return { ok: true };
  };

  const updateDebt = (id: string, muddat: string): ActionResult => {
    setData((current) => ({ ...current, debts: current.debts.map((debt) => debt.id === id ? normalizeDebt({ ...debt, muddat }) : debt) }));
    return { ok: true };
  };

  const savePayable = (input: PayableInput): ActionResult => {
    if (!input.yetkazibBeruvchi.trim()) return { ok: false, message: 'Firma yoki yetkazib beruvchi nomini kiriting.' };
    if (input.jamiQarz <= 0) return { ok: false, message: 'Jami qarz summasi 0 dan katta bo‘lishi kerak.' };
    if (!input.sana || !input.muddat) return { ok: false, message: 'Qarz sanasi va muddatini kiriting.' };

    const old = input.id ? data.payables.find((item) => item.id === input.id) : undefined;
    if (old && input.jamiQarz < old.tolangan) return { ok: false, message: `Jami qarz to‘langan summadan kam bo‘la olmaydi: ${old.tolangan}.` };

    const id = input.id ?? uid();
    const openingId = `payable-open-${id}`;
    const openingHistoryId = old?.tarix.find((item) => item.turi === 'Qarz qo‘shildi')?.id ?? openingId;
    const record: PayableDebt = normalizePayable({
      id,
      yetkazibBeruvchi: input.yetkazibBeruvchi.trim(),
      telefon: input.telefon.trim(),
      kategoriya: input.kategoriya,
      jamiQarz: input.jamiQarz,
      tolangan: old?.tolangan ?? 0,
      qolganQarz: input.jamiQarz - (old?.tolangan ?? 0),
      muddat: input.muddat,
      holat: old?.holat ?? 'Qarzdor',
      izoh: input.izoh.trim(),
      tarix: old
        ? old.tarix.map((item) => item.id === openingHistoryId ? { ...item, sana: input.sana, summa: input.jamiQarz, izoh: input.izoh.trim() || 'Yetkazib beruvchidan qarz olindi' } : item)
        : [{ id: openingId, sana: input.sana, summa: input.jamiQarz, izoh: input.izoh.trim() || 'Yetkazib beruvchidan qarz olindi', turi: 'Qarz qo‘shildi' }],
      createdAt: old?.createdAt ?? now(),
    });

    setData((current) => ({
      ...current,
      payables: old
        ? (current.payables ?? []).map((item) => item.id === id ? record : item)
        : [record, ...(current.payables ?? [])],
    }));
    return { ok: true };
  };

  const deletePayable = (id: string): ActionResult => {
    const payable = data.payables.find((item) => item.id === id);
    if (!payable) return { ok: false, message: 'Qarz topilmadi.' };
    const paymentIds = new Set(payable.tarix.filter((item) => item.turi === 'To‘lov').map((item) => item.id));
    setData((current) => ({
      ...current,
      payables: (current.payables ?? []).filter((item) => item.id !== id),
      expenses: current.expenses.filter((item) => !item.sourceId || !paymentIds.has(item.sourceId)),
    }));
    return { ok: true };
  };

  const addPayablePayment = (payableId: string, amount: number, date: string, note: string): ActionResult => {
    const payable = data.payables.find((item) => item.id === payableId);
    if (!payable) return { ok: false, message: 'Qarz topilmadi.' };
    if (amount <= 0 || amount > payable.qolganQarz) return { ok: false, message: `To‘lov 1 dan ${payable.qolganQarz} gacha bo‘lishi kerak.` };
    if (!date) return { ok: false, message: 'To‘lov sanasini kiriting.' };

    const historyId = uid();
    const paymentNote = note.trim() || 'Yetkazib beruvchiga qarz to‘lovi';
    setData((current) => ({
      ...current,
      payables: (current.payables ?? []).map((item) => item.id === payableId ? normalizePayable({
        ...item,
        tolangan: item.tolangan + amount,
        tarix: [{ id: historyId, sana: date, summa: amount, izoh: paymentNote, turi: 'To‘lov' }, ...item.tarix],
      }) : item),
      expenses: [{
        id: `payable-expense-${historyId}`,
        kategoriya: payable.kategoriya,
        summa: amount,
        sana: date,
        izoh: `${payable.yetkazibBeruvchi}: ${paymentNote}`,
        sourceId: historyId,
        createdAt: now(),
      }, ...current.expenses],
    }));
    return { ok: true };
  };

  const saveIncome = (input: IncomeInput): ActionResult => {
    const old = input.id ? data.incomes.find((item) => item.id === input.id) : undefined;
    if (old?.sourceId) return { ok: false, message: 'Avtomatik kirimni tahrirlab bo‘lmaydi.' };
    setData((current) => ({ ...current, incomes: input.id ? current.incomes.map((item) => item.id === input.id ? { ...item, ...input } as Income : item) : [{ ...input, id: uid(), createdAt: now() } as Income, ...current.incomes] }));
    return { ok: true };
  };

  const deleteIncome = (id: string): ActionResult => {
    const item = data.incomes.find((income) => income.id === id);
    if (item?.sourceId) return { ok: false, message: 'Avtomatik kirim manba operatsiyasi bilan bog‘langan.' };
    setData((current) => ({ ...current, incomes: current.incomes.filter((income) => income.id !== id) }));
    return { ok: true };
  };

  const saveExpense = (input: ExpenseInput): ActionResult => {
    const old = input.id ? data.expenses.find((item) => item.id === input.id) : undefined;
    if (old?.sourceId) return { ok: false, message: 'Avtomatik yaratilgan chiqimni bu yerdan tahrirlab bo‘lmaydi.' };
    setData((current) => ({ ...current, expenses: input.id ? current.expenses.map((item) => item.id === input.id ? { ...item, ...input } as Expense : item) : [{ ...input, id: uid(), createdAt: now() } as Expense, ...current.expenses] }));
    return { ok: true };
  };

  const deleteExpense = (id: string): ActionResult => {
    const item = data.expenses.find((expense) => expense.id === id);
    if (item?.sourceId) return { ok: false, message: 'Bu chiqim manba operatsiyasi bilan bog‘langan.' };
    setData((current) => ({ ...current, expenses: current.expenses.filter((expense) => expense.id !== id) }));
    return { ok: true };
  };

  const updateSettings = (settings: AppSettings) => setData((current) => ({ ...current, settings }));
  const resetDemo = () => setData(createDemoData());

  const value = useMemo<AppStoreValue>(() => ({ data, savePerfume, deletePerfume, saveCustomer, deleteCustomer, saveStockIn, deleteStockIn, saveSale, deleteSale, addDebtPayment, updateDebt, savePayable, deletePayable, addPayablePayment, saveIncome, deleteIncome, saveExpense, deleteExpense, updateSettings, resetDemo }), [data]);
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) throw new Error('useAppStore AppStoreProvider ichida ishlatilishi kerak');
  return context;
}
