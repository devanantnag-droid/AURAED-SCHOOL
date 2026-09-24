import { Award } from 'lucide-react';
import type { RecentMark } from '@/services/portal.service';

function grade(pct: number): string {
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export function MobileResults({ marks }: { marks: RecentMark[] }) {
  if (marks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
        <Award size={32} />
        <p className="text-sm">No results published yet</p>
      </div>
    );
  }

  const byExam = new Map<string, RecentMark[]>();
  marks.forEach((m) => {
    const list = byExam.get(m.examName) ?? [];
    list.push(m);
    byExam.set(m.examName, list);
  });

  return (
    <div className="space-y-5 p-4">
      {Array.from(byExam.entries()).map(([examName, rows]) => {
        const totalObtained = rows.reduce((s, r) => s + (r.marksObtained ?? 0), 0);
        const totalMax = rows.reduce((s, r) => s + r.maxMarks, 0);
        const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

        return (
          <section key={examName}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-primary-900 dark:text-gray-50">{examName}</p>
              <span className="text-xs font-medium text-gray-500">{pct}% · Grade {grade(pct)}</span>
            </div>
            <ul className="space-y-1.5">
              {rows.map((r, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
                  <span className="text-gray-700 dark:text-gray-300">{r.subjectName}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-50">
                    {r.marksObtained ?? '—'} / {r.maxMarks}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
