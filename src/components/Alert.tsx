import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

const tones = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  warning: 'border-dashed border-amber-300 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
} as const;

interface AlertProps {
  tone?: keyof typeof tones;
  /** Pass nothing (or false) to hide the alert while keeping the live region mounted. */
  children?: ReactNode;
}
/* The alert is a live region, so it will be announced by screen readers when it appears. */
export function Alert({ tone = 'info', children }: AlertProps) {
  const hasContent =
    children !== undefined &&
    children !== null &&
    children !== false &&
    children !== '';

  return (
    // role="status" announces politely; errors use role="alert" to interrupt.
    <div role={tone === 'error' ? 'alert' : 'status'}>
      {hasContent && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-md border px-3 py-2 text-sm',
            tones[tone],
          )}
        >
          {tone !== 'info' && <span aria-hidden="true">⚠</span>}
          <div>{children}</div>
        </div>
      )}
    </div>
  );
}
