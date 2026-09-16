import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  approveCorrectionRequest,
  getMissingPunches,
  listSchoolCorrectionRequests,
  listSchoolPunchesForDate,
  rejectCorrectionRequest,
  type SchoolPunchRow,
} from '@/services/punch.service';
import type { CorrectionRequest } from '@/types/punch';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMinutes(mins: number | null): string {
  if (mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function PunchReportsInner() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<'daily' | 'corrections'>('daily');
  const [date, setDate] = useState(todayIso());
  const [punches, setPunches] = useState<SchoolPunchRow[]>([]);
  const [missing, setMissing] = useState<{ id: string; fullName: string; employeeId: string }[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadDaily() {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      const [p, m] = await Promise.all([
        listSchoolPunchesForDate(profile.schoolId, date),
        getMissingPunches(profile.schoolId, date),
      ]);
      setPunches(p);
      setMissing(m);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load punch report.'));
    } finally {
      setLoading(false);
    }
  }

  async function loadCorrections() {
    if (!profile?.schoolId) return;
    setLoading(true);
    try {
      setCorrections(await listSchoolCorrectionRequests(profile.schoolId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load correction requests.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'daily') loadDaily();
    else loadCorrections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, date, profile?.schoolId]);

  async function handleApprove(id: string) {
    setErrorMsg(null);
    try {
      await approveCorrectionRequest(id);
      loadCorrections();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to approve request.'));
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) return;
    setErrorMsg(null);
    try {
      await rejectCorrectionRequest(id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
      loadCorrections();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to reject request.'));
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-50">Teacher Attendance</h1>

      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        <button
          onClick={() => setTab('daily')}
          className={`border-b-2 px-3 py-2 ${tab === 'daily' ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
        >
          Daily punches
        </button>
        <button
          onClick={() => setTab('corrections')}
          className={`border-b-2 px-3 py-2 ${tab === 'corrections' ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
        >
          Correction requests
          {corrections.filter((c) => c.status === 'pending').length > 0 && (
            <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {corrections.filter((c) => c.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      {tab === 'daily' && (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">Date</label>
            <input type="date" className="input max-w-xs" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <>
              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">
                Punched ({punches.length})
              </h2>
              {punches.length === 0 ? (
                <p className="mb-6 text-sm text-gray-500">No one has punched in yet for this date.</p>
              ) : (
                <ul className="mb-6 divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
                  {punches.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-3 py-2">
                      <span className="font-medium text-gray-900 dark:text-gray-50">
                        {p.teachers?.full_name ?? p.teacher_id}
                      </span>
                      <span className="text-gray-500">
                        {formatTime(p.punch_in)} – {formatTime(p.punch_out)}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">{formatMinutes(p.working_minutes)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">
                Missing punch ({missing.length})
              </h2>
              {missing.length === 0 ? (
                <p className="text-sm text-gray-500">Everyone has punched in.</p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-md border border-amber-200 bg-amber-50 text-sm dark:divide-gray-800 dark:border-amber-900 dark:bg-amber-950">
                  {missing.map((t) => (
                    <li key={t.id} className="px-3 py-2 text-amber-800 dark:text-amber-300">
                      {t.fullName} ({t.employeeId})
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}

      {tab === 'corrections' && (
        <PermissionGate
          code="attendance.edit"
          fallback={<p className="text-sm text-gray-500">You don't have permission to review corrections.</p>}
        >
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : corrections.length === 0 ? (
            <p className="text-sm text-gray-500">No correction requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {corrections.map((c) => (
                <li key={c.id} className="rounded-md border border-gray-200 p-3 text-sm dark:border-gray-800">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-50">
                      {c.teacherName ?? c.teacherId} · {c.punchDate}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : c.status === 'approved'
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mb-1 text-gray-600 dark:text-gray-400">{c.reason}</p>
                  <p className="mb-2 text-xs text-gray-500">
                    Requested: {c.requestedPunchIn ? new Date(c.requestedPunchIn).toLocaleString() : '—'} →{' '}
                    {c.requestedPunchOut ? new Date(c.requestedPunchOut).toLocaleString() : '—'}
                  </p>
                  {c.rejectionReason && (
                    <p className="mb-2 text-xs text-red-600">Rejected: {c.rejectionReason}</p>
                  )}

                  {c.status === 'pending' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleApprove(c.id)}
                        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        Approve
                      </button>
                      {rejectingId === c.id ? (
                        <>
                          <input
                            className="input max-w-xs text-xs"
                            placeholder="Rejection reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <button
                            onClick={() => handleReject(c.id)}
                            disabled={!rejectReason.trim()}
                            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            Confirm reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setRejectingId(c.id)}
                          className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </PermissionGate>
      )}
    </div>
  );
}

export function PunchReportsPage() {
  return (
    <FeatureGate feature="teacher_punch">
      <PunchReportsInner />
    </FeatureGate>
  );
}
