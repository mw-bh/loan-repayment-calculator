import { useId, type ComponentProps } from 'react';
import { cn } from '../utils/cn';

/**
 * Shared by text inputs and selects so every control looks the same.
 * - border-gray-500 meets the 3:1 non-text contrast minimum (WCAG 1.4.11).
 * - outline-hidden (not outline-none) keeps a focus outline in forced-colours
 *   / Windows High Contrast mode; the solid ring is the visible focus style.
 */
export const controlClasses =
  'w-full rounded-md border border-gray-500 bg-white px-3 py-2 text-sm tabular-nums shadow-xs outline-hidden transition-colors focus:border-accent focus:ring-2 focus:ring-accent aria-invalid:border-danger aria-invalid:focus:ring-danger disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';

interface FormFieldProps extends Omit<ComponentProps<'input'>, 'prefix'> {
  label: string;
  /** Grey helper text; replaced by `error` when present. */
  hint?: string;
  error?: string;
  /** Fixed adornment inside the input, e.g. "£". Also added to the accessible label. */
  prefix?: string;
  /** Fixed adornment inside the input, e.g. "%". Also added to the accessible label. */
  suffix?: string;
}

export function FormField({
  label,
  hint,
  error,
  prefix,
  suffix,
  required,
  id,
  className,
  ...inputProps
}: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;
  const unit = prefix ?? suffix;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
        {label}
        {/* The visual adornment is aria-hidden, so announce the unit with the label. */}
        {unit && <span className="sr-only"> ({unit})</span>}
      </label>

      <div className="relative flex items-center">
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 text-sm text-gray-500"
          >
            {prefix}
          </span>
        )}
        <input
          id={inputId}
          // aria-required rather than native `required`, so the browser's own validation pop-ups don't compete with our error messages.
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={cn(
            controlClasses,
            prefix && 'pl-7',
            suffix && 'pr-8',
            className,
          )}
          {...inputProps}
        />
        {suffix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 text-sm text-gray-500"
          >
            {suffix}
          </span>
        )}
      </div>

      {message && (
        <p
          id={messageId}
          className={error ? 'text-sm text-danger' : 'text-xs text-gray-500'}
        >
          {message}
        </p>
      )}
    </div>
  );
}
