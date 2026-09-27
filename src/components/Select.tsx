import { useId, type ComponentProps } from 'react';
import { cn } from '../utils/cn';
import { controlClasses } from './FormField';

interface SelectProps extends ComponentProps<'select'> {
  /** Inline label shown to the left of the dropdown. */
  label: string;
}

export function Select({
  label,
  id,
  className,
  children,
  ...selectProps
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={selectId}
        className={cn(controlClasses, 'w-auto pr-8', className)}
        {...selectProps}
      >
        {children}
      </select>
    </div>
  );
}
