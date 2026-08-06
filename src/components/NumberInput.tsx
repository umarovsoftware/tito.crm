import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { formatNumberInputValue, parseNumberInput, type NumberInputValue } from '../utils/numberInput';

type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange' | 'inputMode'> & {
  value: NumberInputValue;
  onValueChange: (value: NumberInputValue) => void;
};

export function NumberInput({ className = 'input', value, onValueChange, placeholder = '0', ...props }: NumberInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseNumberInput(event.target.value));
  };

  return (
    <input
      {...props}
      className={className}
      inputMode="decimal"
      placeholder={placeholder}
      type="text"
      value={formatNumberInputValue(value)}
      onChange={handleChange}
    />
  );
}
