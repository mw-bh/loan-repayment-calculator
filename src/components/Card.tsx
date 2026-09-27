import { useId, type ReactNode } from 'react';

interface CardProps {
  title: string;
  /** Optional content on the right of the header, e.g. the currency selector. */
  actions?: ReactNode;
  children: ReactNode;
}

export function Card({ title, actions, children }: CardProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-medium">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
