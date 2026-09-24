import type { ReactNode } from 'react';

interface Props {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

// Sticks to the top of whichever scrollable ancestor contains it (the
// <main> element in SchoolLayout/SuperAdminLayout) rather than the
// whole page — this is what makes the header stay visible while the
// person scrolls through a long list below it. The negative horizontal
// margin cancels the parent's own padding so the background spans the
// full width when stuck, rather than floating with visible gaps on
// either side.
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="sticky top-0 z-10 -mx-6 mb-4 flex items-center justify-between gap-3 border-b border-gray-200 bg-paper px-6 pb-4 pt-6 dark:border-gray-800 dark:bg-paper-dark">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
