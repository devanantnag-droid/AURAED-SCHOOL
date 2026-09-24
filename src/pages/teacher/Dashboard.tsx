import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isNativeApp } from '@/lib/platform';
import { getCurrentLocation } from '@/lib/location';
import { PortalTopBar } from '@/components/layout/PortalTopBar';
import { MyLeaveRequests } from '@/components/shared/MyLeaveRequests';
import { ClassLeaveRequestsToReview } from '@/components/shared/ClassLeaveRequestsToReview';
import {
  getMyPunchHistory,
  getMyTeacherId,
  getTodayPunch,
  punchIn,
  punchOut,
  submitCorrectionRequest,
} from '@/services/punch.service';
import { getErrorMessage } from '@/lib/errors';
import { listSessions, listTeacherTimetable } from '@/services/academics.service';
import { DAY_NAMES } from '@/types/academics';
import type { TimetableEntry } from '@/types/academics';
import type { PunchRecord } from '@/types/punch';

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

export function TeacherDashboard() {
  if (isNativeApp()) {
    return <Navigate to="/school/dashboard" replace />;
  }
  const { profile } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [today, setToday] = useState<PunchRecord | null>(null);
  const [history, setHistory] = useState<PunchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionPunchIn, setCorrectionPunchIn] = useState('');
  const [correctionPunchOut, setCorrectionPunchOut] = useState('');
  const [correctionMsg, setCorrectionMsg] = useState<string | null>(null);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);

  async function load() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const id = await getMyTeacherId();
      setTeacherId(id);
      if (id && profile?.schoolId) {
        const [t, h, sessions] = await Promise.all([
          getTodayPunch(id),
          getMyPunchHistory(id),
          listSessions(profile.schoolId),
        ]);
        setToday(t);
        setHistory(h);
        const current = sessions.find((s) => s.isCurrent) ?? sessions[0];
        if (current) {
          setTimetable(await listTeacherTimetable(profile.schoolId, current.id, id));
        }
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load punch data.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePunchIn() {
    if (!teacherId || !profile?.schoolId) return;
    setWorking(true);
    setErrorMsg(null);
    try {
      const location = await getCurrentLocation();
      await punchIn(profile.schoolId, teacherId, location);
      await load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to punch in.'));
    } finally {
      setWorking(false);
    }
  }

  async function handlePunchOut() {
    if (!today) return;
    setWorking(true);
    setErrorMsg(null);
    try {
      const location = await getCurrentLocation();
      await punchOut(today.id, location);
      await load();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to punch out.'));
    } finally {
      setWorking(false);
    }
  }

  async function handleSubmitCorrection() {
    if (!teacherId || !profile?.schoolId || !correctionReason.trim()) return;
    setCorrectionMsg(null);
    try {
      await submitCorrectionRequest({
        schoolId: profile.schoolId,
        teacherId,
        punchDate: today?.punchDate ?? new Date().toISOString().slice(0, 10),
        requestedPunchIn: correctionPunchIn || undefined,
        requestedPunchOut: correctionPunchOut || undefined,
        reason: correctionReason,
      });
      setCorrectionMsg('Correction request submitted. Your admin will review it.');
      setShowCorrection(false);
      setCorrectionReason('');
      setCorrectionPunchIn('');
      setCorrectionPunchOut('');
    } catch (err) {
      setCorrectionMsg(getErrorMessage(err, 'Failed to submit request.'));
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  if (!teacherId) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">Welcome, {profile?.fullName}</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your account isn't linked to a teacher record yet. Ask your School Admin to link your login.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <PortalTopBar title="Teacher Dashboard" />

      {errorMsg && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorMsg}
        </p>
      )}

      <ClassLeaveRequestsToReview />

      {profile?.schoolId && teacherId && (
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Leave</h2>
          <MyLeaveRequests schoolId={profile.schoolId} requesterType="teacher" teacherId={teacherId} />
        </section>
      )}

      <section className="mb-6 rounded-md border border-gray-200 p-5 text-center dark:border-gray-800">
        <p className="mb-4 text-sm text-gray-500">Today · {new Date().toLocaleDateString()}</p>

        <div className="mb-5 flex justify-center gap-8 text-sm">
          <div>
            <p className="text-xs text-gray-500">Punch In</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{formatTime(today?.punchIn ?? null)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Punch Out</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">{formatTime(today?.punchOut ?? null)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Working Hours</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              {formatMinutes(today?.workingMinutes ?? null)}
            </p>
          </div>
        </div>

        {!today?.punchIn ? (
          <button
            onClick={handlePunchIn}
            disabled={working}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <LogIn size={18} />
            {working ? 'Getting location…' : 'Punch In'}
          </button>
        ) : !today?.punchOut ? (
          <button
            onClick={handlePunchOut}
            disabled={working}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            <LogOut size={18} />
            {working ? 'Getting location…' : 'Punch Out'}
          </button>
        ) : (
          <p className="text-sm text-gray-500">You've completed your punch for today.</p>
        )}
      </section>

      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Link to="/school/attendance" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Mark Attendance
        </Link>
        <Link to="/school/homework" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Homework
        </Link>
        <Link to="/school/assignments-work" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Assignments
        </Link>
        <Link to="/school/materials" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Study Materials
        </Link>
        <Link to="/school/marks" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Marks
        </Link>
        <Link to="/school/payroll" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          My Payslips
        </Link>
        <Link to="/school/library" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Library
        </Link>
        <Link to="/school/messaging" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Messages
        </Link>
        <Link to="/school/events" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          Events
        </Link>
        <Link to="/school/ptm" className="rounded-md border border-gray-200 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
          PTM
        </Link>
      </div>

      <div className="mb-6 text-right">
        <button
          onClick={() => setShowCorrection((v) => !v)}
          className="text-sm text-primary-600 hover:underline"
        >
          Missed a punch or made a mistake? Request a correction
        </button>
      </div>

      {showCorrection && (
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Request correction</h2>
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Requested punch in</label>
              <input
                type="datetime-local"
                className="input"
                value={correctionPunchIn}
                onChange={(e) => setCorrectionPunchIn(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Requested punch out</label>
              <input
                type="datetime-local"
                className="input"
                value={correctionPunchOut}
                onChange={(e) => setCorrectionPunchOut(e.target.value)}
              />
            </div>
          </div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Reason</label>
          <textarea
            className="input mb-3"
            rows={2}
            placeholder="e.g. Forgot to punch out yesterday"
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
          />
          <button
            onClick={handleSubmitCorrection}
            disabled={!correctionReason.trim()}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            Submit request
          </button>
        </section>
      )}

      {correctionMsg && (
        <p className="mb-6 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {correctionMsg}
        </p>
      )}

      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-50">
          <Clock size={15} /> Recent punches
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No punch history yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-700 dark:text-gray-300">{h.punchDate}</span>
                <span className="text-gray-500">
                  {formatTime(h.punchIn)} – {formatTime(h.punchOut)}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {formatMinutes(h.workingMinutes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {timetable.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">My Timetable</h2>
          <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
            {timetable.map((t) => (
              <li key={t.id} className="flex items-center justify-between px-3 py-2">
                <span className="text-gray-700 dark:text-gray-300">
                  {DAY_NAMES[t.dayOfWeek]} · Period {t.periodNumber}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-50">
                  {t.className} - {t.sectionName} · {t.subjectName}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
