export type NumberInputValue = number | '';

export const removeNumberSpaces = (rawValue: string): string => rawValue.replace(/\s/g, '');

export const parseNumberInput = (rawValue: string): NumberInputValue => {
  const normalizedValue = removeNumberSpaces(rawValue);
  if (normalizedValue === '') return '';
  const value = Number(normalizedValue);
  return Number.isFinite(value) ? value : '';
};

export const formatNumberInputValue = (value: NumberInputValue): string => {
  if (value === '') return '';

  const [integerPart, decimalPart] = String(value).split('.');
  const sign = integerPart.startsWith('-') ? '-' : '';
  const digits = sign ? integerPart.slice(1) : integerPart;
  const formattedInteger = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return decimalPart === undefined ? `${sign}${formattedInteger}` : `${sign}${formattedInteger}.${decimalPart}`;
};

export const numberOrZero = (value: NumberInputValue): number => value === '' ? 0 : value;
