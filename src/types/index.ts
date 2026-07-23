export type Category = 'Erkaklar' | 'Ayollar' | 'Unisex';
export type PaymentType = 'Naqd' | 'Karta' | 'O‘tkazma' | 'Qarz';
export type SaleType = 'Doimiy mijoz' | 'Tasodifiy xaridor';
export type DebtStatus = 'Qarzdor' | 'Qisman to‘langan' | 'Qarz yopilgan' | 'Muddati o‘tgan';
export type ExpenseCategory = 'Tovar xaridi' | 'Ijara' | 'Maosh' | 'Transport' | 'Reklama' | 'Soliq' | 'Boshqa';

export interface Perfume {
  id: string;
  firmaNomi: string;
  tovarNomi: string;
  kategoriya: Category;
  hajmiMl: number;
  barcode: string;
  kelishNarxi: number;
  sotuvNarxi: number;
  qoldiq: number;
  minimalQoldiq: number;
  rasm: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  ism: string;
  telefon: string;
  manzil: string;
  createdAt: string;
}

export interface StockIn {
  id: string;
  perfumeId: string;
  miqdor: number;
  kelishNarxi: number;
  yetkazibBeruvchi: string;
  sana: string;
  izoh: string;
  createdAt: string;
}

export interface SaleItem {
  id?: string;
  perfumeId: string;
  miqdor: number;
  sotuvNarxi: number;
  /** Server-frozen cost at the moment of sale; read-only, ignored if sent by the client. */
  kelishNarxi?: number;
  jamiSumma?: number;
}

export interface Sale {
  id: string;
  sotuvKodi: string;
  saleTuri: SaleType;
  customerId: string;
  xaridorKodi: string;
  items: SaleItem[];
  jamiSumma: number;
  tolovTuri: PaymentType;
  ulgurjiSavdo: boolean;
  yetkazibBerish: boolean;
  yetkazibBerishManzili: string;
  sana: string;
  createdAt: string;
}

export interface DebtHistory {
  id: string;
  sana: string;
  summa: number;
  izoh: string;
  turi: 'Qarz qo‘shildi' | 'To‘lov';
}

export interface Debt {
  id: string;
  mijozId: string;
  mijozNomi: string;
  telefon: string;
  jamiQarz: number;
  tolangan: number;
  qolganQarz: number;
  muddat: string;
  holat: DebtStatus;
  tarix: DebtHistory[];
  createdAt: string;
}


export interface PayableHistory {
  id: string;
  sana: string;
  summa: number;
  izoh: string;
  turi: 'Qarz qo‘shildi' | 'To‘lov';
}

export interface PayableDebt {
  id: string;
  yetkazibBeruvchi: string;
  telefon: string;
  kategoriya: ExpenseCategory;
  jamiQarz: number;
  tolangan: number;
  qolganQarz: number;
  muddat: string;
  holat: DebtStatus;
  izoh: string;
  tarix: PayableHistory[];
  createdAt: string;
}

export interface Income {
  id: string;
  kategoriya: 'Sotuv' | 'Qarz to‘lovi' | 'Boshqa';
  summa: number;
  sana: string;
  izoh: string;
  sourceId?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  kategoriya: ExpenseCategory;
  summa: number;
  sana: string;
  izoh: string;
  sourceId?: string;
  createdAt: string;
}

export interface AppSettings {
  dokonNomi: string;
  telefon: string;
  manzil: string;
  valyuta: string;
  darkMode: boolean;
}

export interface Employee {
  id: number;
  username: string;
  ism: string;
  familiya: string;
  email: string;
  faol: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  foydalanuvchi: string;
  foydalanuvchiId: number | null;
  amal: string;
  model: string;
  obyekt: string;
  izoh: string;
  sana: string;
}

export interface AppData {
  perfumes: Perfume[];
  customers: Customer[];
  stockIns: StockIn[];
  sales: Sale[];
  debts: Debt[];
  payables: PayableDebt[];
  incomes: Income[];
  expenses: Expense[];
  settings: AppSettings;
  employees: Employee[];
  activityLogs: ActivityLog[];
}

export type DatePreset = 'today' | 'week' | 'month' | 'custom';
export interface DateRange {
  preset: DatePreset;
  start: string;
  end: string;
}
