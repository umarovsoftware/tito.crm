import type { AppData, Customer, Debt, Expense, Income, PayableDebt, Perfume, Sale, StockIn } from '../types';
import { daysAgo, today } from '../utils/date';
import { getDebtStatus } from '../utils/calculations';

const img = (seed: string) => `https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80&sig=${seed}`;

const perfumeSeeds: Array<Omit<Perfume, 'id' | 'createdAt' | 'rasm'>> = [
  { firmaNomi: 'Dior', tovarNomi: 'Sauvage Elixir', kategoriya: 'Erkaklar', hajmiMl: 60, barcode: '100000000001', kelishNarxi: 1450000, sotuvNarxi: 1890000, qoldiq: 12, minimalQoldiq: 4 },
  { firmaNomi: 'Dior', tovarNomi: 'J’adore', kategoriya: 'Ayollar', hajmiMl: 100, barcode: '100000000002', kelishNarxi: 1320000, sotuvNarxi: 1740000, qoldiq: 3, minimalQoldiq: 5 },
  { firmaNomi: 'Chanel', tovarNomi: 'Bleu de Chanel', kategoriya: 'Erkaklar', hajmiMl: 100, barcode: '100000000003', kelishNarxi: 1570000, sotuvNarxi: 2050000, qoldiq: 15, minimalQoldiq: 5 },
  { firmaNomi: 'Chanel', tovarNomi: 'Coco Mademoiselle', kategoriya: 'Ayollar', hajmiMl: 100, barcode: '100000000004', kelishNarxi: 1650000, sotuvNarxi: 2160000, qoldiq: 8, minimalQoldiq: 4 },
  { firmaNomi: 'Tom Ford', tovarNomi: 'Oud Wood', kategoriya: 'Unisex', hajmiMl: 100, barcode: '100000000005', kelishNarxi: 2250000, sotuvNarxi: 2950000, qoldiq: 2, minimalQoldiq: 4 },
  { firmaNomi: 'Tom Ford', tovarNomi: 'Lost Cherry', kategoriya: 'Unisex', hajmiMl: 100, barcode: '100000000006', kelishNarxi: 2380000, sotuvNarxi: 3100000, qoldiq: 7, minimalQoldiq: 3 },
  { firmaNomi: 'Creed', tovarNomi: 'Aventus', kategoriya: 'Erkaklar', hajmiMl: 100, barcode: '100000000007', kelishNarxi: 2650000, sotuvNarxi: 3480000, qoldiq: 10, minimalQoldiq: 3 },
  { firmaNomi: 'Creed', tovarNomi: 'Silver Mountain Water', kategoriya: 'Unisex', hajmiMl: 100, barcode: '100000000008', kelishNarxi: 2450000, sotuvNarxi: 3250000, qoldiq: 4, minimalQoldiq: 4 },
  { firmaNomi: 'Lattafa', tovarNomi: 'Khamrah', kategoriya: 'Unisex', hajmiMl: 100, barcode: '100000000009', kelishNarxi: 320000, sotuvNarxi: 490000, qoldiq: 28, minimalQoldiq: 8 },
  { firmaNomi: 'Lattafa', tovarNomi: 'Asad', kategoriya: 'Erkaklar', hajmiMl: 100, barcode: '100000000010', kelishNarxi: 280000, sotuvNarxi: 440000, qoldiq: 31, minimalQoldiq: 8 },
  { firmaNomi: 'Yves Saint Laurent', tovarNomi: 'Y EDP', kategoriya: 'Erkaklar', hajmiMl: 100, barcode: '100000000011', kelishNarxi: 1350000, sotuvNarxi: 1790000, qoldiq: 9, minimalQoldiq: 4 },
  { firmaNomi: 'Yves Saint Laurent', tovarNomi: 'Libre', kategoriya: 'Ayollar', hajmiMl: 90, barcode: '100000000012', kelishNarxi: 1420000, sotuvNarxi: 1880000, qoldiq: 6, minimalQoldiq: 4 },
  { firmaNomi: 'Giorgio Armani', tovarNomi: 'Acqua di Gio', kategoriya: 'Erkaklar', hajmiMl: 100, barcode: '100000000013', kelishNarxi: 1180000, sotuvNarxi: 1580000, qoldiq: 14, minimalQoldiq: 5 },
  { firmaNomi: 'Giorgio Armani', tovarNomi: 'My Way', kategoriya: 'Ayollar', hajmiMl: 90, barcode: '100000000014', kelishNarxi: 1250000, sotuvNarxi: 1690000, qoldiq: 5, minimalQoldiq: 4 },
  { firmaNomi: 'Versace', tovarNomi: 'Eros', kategoriya: 'Erkaklar', hajmiMl: 100, barcode: '100000000015', kelishNarxi: 820000, sotuvNarxi: 1190000, qoldiq: 20, minimalQoldiq: 6 },
  { firmaNomi: 'Versace', tovarNomi: 'Bright Crystal', kategoriya: 'Ayollar', hajmiMl: 90, barcode: '100000000016', kelishNarxi: 780000, sotuvNarxi: 1120000, qoldiq: 4, minimalQoldiq: 5 },
  { firmaNomi: 'Maison Francis Kurkdjian', tovarNomi: 'Baccarat Rouge 540', kategoriya: 'Unisex', hajmiMl: 70, barcode: '100000000017', kelishNarxi: 2850000, sotuvNarxi: 3750000, qoldiq: 6, minimalQoldiq: 2 },
  { firmaNomi: 'Jo Malone', tovarNomi: 'Wood Sage & Sea Salt', kategoriya: 'Unisex', hajmiMl: 100, barcode: '100000000018', kelishNarxi: 1450000, sotuvNarxi: 1920000, qoldiq: 11, minimalQoldiq: 4 },
  { firmaNomi: 'Narciso Rodriguez', tovarNomi: 'For Her', kategoriya: 'Ayollar', hajmiMl: 100, barcode: '100000000019', kelishNarxi: 980000, sotuvNarxi: 1390000, qoldiq: 3, minimalQoldiq: 5 },
  { firmaNomi: 'Paco Rabanne', tovarNomi: '1 Million', kategoriya: 'Erkaklar', hajmiMl: 100, barcode: '100000000020', kelishNarxi: 940000, sotuvNarxi: 1340000, qoldiq: 18, minimalQoldiq: 5 },
];

const customerNames = [
  ['Akmal Rahimov', '+998 90 123 45 67', 'Yunusobod'], ['Dilnoza Karimova', '+998 93 221 10 20', 'Chilonzor'],
  ['Javohir Usmonov', '+998 99 331 44 55', 'Sergeli'], ['Malika Aliyeva', '+998 97 554 32 10', 'Mirzo Ulug‘bek'],
  ['Sardor Tursunov', '+998 95 700 88 11', 'Olmazor'], ['Nilufar Hasanona', '+998 90 875 20 20', 'Yakkasaroy'],
  ['Behruz Mamatov', '+998 93 100 90 80', 'Uchtepa'], ['Shahnoza Qodirova', '+998 99 654 33 21', 'Shayxontohur'],
  ['Azizbek Sobirov', '+998 97 222 11 44', 'Bektemir'], ['Mohira Islomova', '+998 95 777 45 45', 'Mirobod'],
  ['Kamron Ergashev', '+998 90 414 14 14', 'Yashnobod'], ['Sevara Gʻaniyeva', '+998 93 909 80 70', 'Chilonzor'],
];

export function createDemoData(): AppData {
  const now = new Date().toISOString();
  const perfumes: Perfume[] = perfumeSeeds.map((item, index) => ({ ...item, id: `p-${index + 1}`, rasm: img(String(index + 1)), createdAt: now }));
  const customers: Customer[] = customerNames.map(([ism, telefon, manzil], index) => ({ id: `c-${index + 1}`, ism, telefon, manzil, createdAt: now }));

  const sales: Sale[] = [];
  const incomes: Income[] = [];
  for (let day = 29; day >= 0; day -= 1) {
    const count = 2 + (day % 3);
    for (let j = 0; j < count; j += 1) {
      const perfume = perfumes[(day * 3 + j * 5) % perfumes.length];
      const customer = customers[(day + j * 2) % customers.length];
      const sana = daysAgo(day);
      const isRegular = (day + j) % 3 !== 0;
      const debtSale = isRegular && (day + j) % 11 === 0;
      const payment = debtSale ? 'Qarz' : (['Naqd', 'Karta', 'O‘tkazma'] as const)[(day + j) % 3];
      const delivery = isRegular && (day + j) % 5 === 0;
      const miqdor = isRegular ? 1 + ((day + j) % 4) : 1;
      const codeSuffix = `${String(day).padStart(2, '0')}${j}`;
      const sale: Sale = {
        id: `sale-${day}-${j}`,
        sotuvKodi: `STV-${sana.replaceAll('-', '')}-${codeSuffix}`,
        saleTuri: isRegular ? 'Doimiy mijoz' : 'Tasodifiy xaridor',
        customerId: isRegular ? customer.id : '',
        xaridorKodi: isRegular ? '' : `TX-${sana.replaceAll('-', '')}-${codeSuffix}`,
        items: [{ perfumeId: perfume.id, miqdor, sotuvNarxi: perfume.sotuvNarxi }],
        jamiSumma: miqdor * perfume.sotuvNarxi,
        tolovTuri: payment,
        ulgurjiSavdo: isRegular && miqdor >= 3,
        yetkazibBerish: delivery,
        yetkazibBerishManzili: delivery ? customer.manzil : '',
        sana,
        createdAt: now,
      };
      sales.push(sale);
      if (!debtSale) {
        const buyer = isRegular ? customer.ism : sale.xaridorKodi;
        incomes.push({
          id: `income-${sale.id}`,
          kategoriya: 'Sotuv',
          summa: sale.jamiSumma,
          sana: sale.sana,
          izoh: `${sale.sotuvKodi} · ${buyer} · ${perfume.firmaNomi} ${perfume.tovarNomi}${delivery ? ' · yetkazib berish bilan' : ''}`,
          sourceId: sale.id,
          createdAt: now,
        });
      }
    }
  }

  const debtCustomers = customers.slice(0, 6);
  const debts: Debt[] = debtCustomers.map((customer, index) => {
    const total = [4200000, 1750000, 2890000, 980000, 3500000, 1260000][index];
    const paid = [1200000, 0, 900000, 980000, 500000, 260000][index];
    const remaining = total - paid;
    const muddat = daysAgo(index % 2 === 0 ? -7 : index - 2);
    const base = {
      id: `debt-${index + 1}`,
      mijozId: customer.id,
      mijozNomi: customer.ism,
      telefon: customer.telefon,
      jamiQarz: total,
      tolangan: paid,
      qolganQarz: remaining,
      muddat,
      createdAt: now,
    };
    const debt: Debt = {
      ...base,
      holat: 'Qarzdor',
      tarix: [
        { id: `dh-${index}-1`, sana: daysAgo(18 - index), summa: total, izoh: 'Qarzga parfyum sotildi', turi: 'Qarz qo‘shildi' },
        ...(paid > 0 ? [{ id: `dh-${index}-2`, sana: daysAgo(5 - index), summa: paid, izoh: 'Mijoz to‘lovi', turi: 'To‘lov' as const }] : []),
      ],
    };
    debt.holat = getDebtStatus(debt);
    if (paid > 0) incomes.push({ id: `income-debt-${index}`, kategoriya: 'Qarz to‘lovi', summa: paid, sana: daysAgo(5 - index), izoh: `${customer.ism} qarz to‘lovi`, sourceId: `dh-${index}-2`, createdAt: now });
    return debt;
  });

  const payableSeeds = [
    ['Premium Distribution', '+998 90 600 10 10', 'Tovar xaridi', 18200000, 6500000, -5, 'Dior va Chanel partiyasi'],
    ['Orient Parfum', '+998 93 700 20 20', 'Tovar xaridi', 9600000, 2600000, 12, 'Lattafa ulgurji kirimi'],
    ['Luxury Trade', '+998 99 800 30 30', 'Tovar xaridi', 14500000, 0, 20, 'Tom Ford va Creed mahsulotlari'],
    ['Golden Rent', '+998 71 200 40 40', 'Ijara', 7200000, 3600000, 7, 'Do‘kon ijarasi'],
    ['Reklama Media', '+998 95 500 50 50', 'Reklama', 2800000, 800000, -2, 'Instagram reklama kampaniyasi'],
  ] as const;

  const payables: PayableDebt[] = payableSeeds.map(([yetkazibBeruvchi, telefon, kategoriya, jamiQarz, tolangan, dueOffset, izoh], index) => {
    const muddat = daysAgo(-dueOffset);
    const debt: PayableDebt = {
      id: `payable-${index + 1}`,
      yetkazibBeruvchi,
      telefon,
      kategoriya,
      jamiQarz,
      tolangan,
      qolganQarz: jamiQarz - tolangan,
      muddat,
      holat: 'Qarzdor',
      izoh,
      tarix: [
        { id: `ph-${index}-1`, sana: daysAgo(24 - index * 2), summa: jamiQarz, izoh, turi: 'Qarz qo‘shildi' },
        ...(tolangan > 0 ? [{ id: `ph-${index}-2`, sana: daysAgo(8 - index), summa: tolangan, izoh: 'Yetkazib beruvchiga to‘lov', turi: 'To‘lov' as const }] : []),
      ],
      createdAt: now,
    };
    debt.holat = getDebtStatus(debt);
    return debt;
  });

  const expenseCategories = ['Tovar xaridi', 'Ijara', 'Maosh', 'Transport', 'Reklama', 'Soliq', 'Boshqa'] as const;
  const expenses: Expense[] = Array.from({ length: 30 }, (_, index) => ({
    id: `expense-${index + 1}`,
    kategoriya: expenseCategories[index % expenseCategories.length],
    summa: index % 6 === 0 ? 4200000 + index * 15000 : 180000 + (index % 5) * 95000,
    sana: daysAgo(29 - index),
    izoh: `${expenseCategories[index % expenseCategories.length]} bo‘yicha demo chiqim`,
    createdAt: now,
  }));

  payables.forEach((payable) => {
    payable.tarix.filter((item) => item.turi === 'To‘lov').forEach((item) => {
      expenses.push({
        id: `payable-expense-${item.id}`,
        kategoriya: payable.kategoriya,
        summa: item.summa,
        sana: item.sana,
        izoh: `${payable.yetkazibBeruvchi}: ${item.izoh}`,
        sourceId: item.id,
        createdAt: now,
      });
    });
  });

  const stockIns: StockIn[] = Array.from({ length: 15 }, (_, index) => ({
    id: `stock-${index + 1}`,
    perfumeId: perfumes[(index * 3) % perfumes.length].id,
    miqdor: 4 + (index % 8),
    kelishNarxi: perfumes[(index * 3) % perfumes.length].kelishNarxi,
    yetkazibBeruvchi: ['Premium Distribution', 'Orient Parfum', 'Luxury Trade'][index % 3],
    sana: daysAgo(28 - index * 2),
    izoh: 'Ombor uchun reja asosidagi kirim',
    createdAt: now,
  }));

  incomes.push({ id: 'manual-income-1', kategoriya: 'Boshqa', summa: 650000, sana: today(), izoh: 'Yetkazib berish xizmati daromadi', createdAt: now });

  return {
    perfumes,
    customers,
    stockIns,
    sales,
    debts,
    payables,
    incomes,
    expenses,
    settings: { dokonNomi: 'Aroma House', telefon: '+998 90 555 55 55', manzil: 'Toshkent shahri', valyuta: 'so‘m', darkMode: false },
  };
}
