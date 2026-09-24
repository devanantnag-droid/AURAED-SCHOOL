import { useState } from 'react';
import { FileBarChart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { getErrorMessage } from '@/lib/errors';
import { exportStudents, exportAttendance, exportFeeCollection } from '@/services/reports.service';

type ReportKey = 'students' | 'attendance' | 'fees';

const REPORTS: { key: ReportKey; label: string }[] = [
  { key: 'students', label: 'Students' },
  { key: 'attendance', label: 'Attendance (date range)' },
  { key: 'fees', label: 'Fee Collection (date range)' },
];

export function MobileReports() {
  const { profile } = useAuth();
  const [selected, setSelected] = useState<ReportKey | null>(null);
  const [fromDate, setFromDate] = useState(new Date().toISOString().slice(0, 8) + '01');
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState<{ headers: string[]; rows: (string | number)[][] } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    if (!profile?.schoolId || !selected) return;
    setGenerating(true);
    setErrorMsg(null);
    setResult(null);
    try {
      if (selected === 'students') {
        setResult(await exportStudents(profile.schoolId));
      } else if (selected === 'attendance') {
        setResult(await exportAttendance(profile.schoolId, fromDate, toDate));
      } else if (selected === 'fees') {
        setResult(await exportFeeCollection(profile.schoolId, fromDate, toDate));
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to generate report.'));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <MobileDetailHeader title="Reports" />

      <div className="p-4">
        {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

        <div className="mb-4 flex flex-wrap gap-1.5">
          {REPORTS.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                setSelected(r.key);
                setResult(null);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                selected === r.key ? 'bg-primary-700 text-white' : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {selected && selected !== 'students' && (
          <div className="mb-3 flex gap-2">
            <input type="date" className="input flex-1" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <input type="date" className="input flex-1" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        )}

        {selected && (
          <button onClick={handleGenerate} disabled={generating} className="btn-primary mb-4 w-full">
            {generating ? 'Generating…' : 'Generate report'}
          </button>
        )}

        {!selected ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
            <FileBarChart size={32} />
            <p className="text-sm">Pick a report to get started</p>
          </div>
        ) : result ? (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {result.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-1.5 font-medium text-gray-600 dark:text-gray-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 dark:border-gray-800">
                    {row.map((cell, j) => (
                      <td key={j} className="whitespace-nowrap px-2 py-1.5 text-gray-700 dark:text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {result.rows.length === 0 && <p className="p-3 text-center text-xs text-gray-500">No data for this range.</p>}
          </div>
        ) : null}
      </div>
    </div>
  );
}
