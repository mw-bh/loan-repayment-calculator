import type { ComponentProps } from 'react';
import { cn } from '../utils/cn';

type Align = 'left' | 'right';
const alignClass: Record<Align, string> = {
  left: 'text-left',
  right: 'text-right',
};

/**
 * Bounded scroll area. Paired with the sticky header in <Th>, this keeps a
 * 360-row schedule usable without pushing the rest of the page off screen.
 * tabIndex lets keyboard users focus and scroll it; role + label tell screen
 * reader users what they've landed on. Use a label distinct from the
 * surrounding Card title (e.g. "Schedule, scrollable") to avoid two regions
 * with the same name.
 */
export function TableContainer({
  label,
  className,
  ...props
}: ComponentProps<'div'> & { label: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'max-h-[32rem] overflow-auto rounded-md border border-gray-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
      {...props}
    />
  );
}

/** `caption` names the table for screen readers; it's visually hidden by default. */
export function Table({
  caption,
  captionVisible = false,
  className,
  children,
  ...props
}: ComponentProps<'table'> & { caption: string; captionVisible?: boolean }) {
  return (
    <table
      className={cn('w-full border-collapse text-sm tabular-nums', className)}
      {...props}
    >
      <caption
        className={
          captionVisible ? 'mb-2 text-left text-sm text-gray-500' : 'sr-only'
        }
      >
        {caption}
      </caption>
      {children}
    </table>
  );
}

export function Th({
  align = 'left',
  className,
  ...props
}: ComponentProps<'th'> & { align?: Align }) {
  return (
    <th
      scope="col"
      className={cn(
        'sticky top-0 z-10 border-b border-gray-200 bg-gray-100 px-3 py-2 font-medium whitespace-nowrap text-gray-700',
        alignClass[align],
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: ComponentProps<'tr'>) {
  return (
    <tr
      className={cn('even:bg-gray-50 hover:bg-blue-50', className)}
      {...props}
    />
  );
}

/** Use align="right" for money columns so the decimals line up. */
export function Td({
  align = 'left',
  className,
  ...props
}: ComponentProps<'td'> & { align?: Align }) {
  return (
    <td
      className={cn(
        'border-b border-gray-100 px-3 py-2 whitespace-nowrap',
        alignClass[align],
        className,
      )}
      {...props}
    />
  );
}
