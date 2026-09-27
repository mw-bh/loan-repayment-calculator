import type { ReactNode } from 'react';

/** Grid of summary figures. Uses a description list: each label describes its value. */
export function StatGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-4 sm:grid-cols-3">{children}</dl>;
}

interface StatProps {
  label: string;
  value: ReactNode;
}

export function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
