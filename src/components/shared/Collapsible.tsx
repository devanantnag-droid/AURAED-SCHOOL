import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

// Used for any list where each item has a compact "always visible" line
// (a name, a status, a date) plus a chunk of detail that's useful but
// takes up real space once a list grows long — announcements, leave
// requests, grievances, circulars, and similar. Starts expanded by
// default so nothing is hidden until the person actively chooses to
// collapse it.
export function Collapsible({ summary, children, defaultExpanded = true, className = '' }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={className}>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">{summary}</div>
        <ChevronDown
          size={18}
          className={`mt-0.5 flex-shrink-0 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && <div className="mt-2">{children}</div>}
    </div>
  );
}
