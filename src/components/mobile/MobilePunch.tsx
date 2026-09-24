import { useEffect, useState } from 'react';
import { LogIn, LogOut, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { MobileDetailHeader } from '@/components/mobile/MobileHeader';
import { getErrorMessage } from '@/lib/errors';
import { getMyTeacherId, getTodayPunch, punchIn, punchOut, submitCorrectionRequest } from '@/services/punch.service';
import { getCurrentLocation } from '@/lib/location';
import type { PunchRecord } from '@/types/punch';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(mins: number | null): string {
  if (mins == null) return '—';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function MobilePunch() {
  const { profile } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [today, setToday] = useState<PunchRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionPunchIn, setCorrectionPunchIn] = useState('');
  const [correctionPunchOut, setCorrectionPunchOut] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionMsg, setCorrectionMsg] = useState<string | null>(null);

  async function load() {
    try {
      const id = await getMyTeacherId();
      setTeacherId(id);
      if (id) setToday(await getTodayPunch(id));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load your punch record.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePunchIn() {
    if (!teacherId || !profile?.schoolId) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const location = await getCurrentLocation();
      if (location.latitude == null || location.longitude == null) {
        setErrorMsg('Couldn\u2019t get your location. Check that location is turned on and this app has permission to use it, then try again.');
        return;
      }
      setToday(await punchIn(profile.schoolId, teacherId, location));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to punch in.'));
    } finally {
      setBusy(false);
    }
  }

  async function handlePunchOut() {
    if (!today) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const location = await getCurrentLocation();
      if (location.latitude == null || location.longitude == null) {
        setErrorMsg('Couldn\u2019t get your location. Check that location is turned on and this app has permission to use it, then try again.');
        return;
      }
      setToday(await punchOut(today.id, location));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to punch out.'));
    } finally {
      setBusy(false);
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

  return (
    <div>
      <MobileDetailHeader title="Punch In / Out" />

      <div className="p-4">
        {errorMsg && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Loading…</p>
        ) : !teacherId ? (
          <p className="py-8 text-center text-sm text-gray-500">Your account isn't linked to a teacher record yet.</p>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-4 text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>

            <div className="mb-5 flex justify-center gap-10 text-sm">
              <div>
                <p className="text-xs text-gray-500">Punch In</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">{formatTime(today?.punchIn ?? null)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Punch Out</p>
                <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-50">{formatTime(today?.punchOut ?? null)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hours</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  <Clock size={16} /> {formatDuration(today?.workingMinutes ?? null)}
                </p>
              </div>
            </div>

            {!today?.punchIn ? (
              <button onClick={handlePunchIn} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-green-700 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60">
                <LogIn size={18} /> {busy ? 'Punching in…' : 'Punch In'}
              </button>
            ) : !today?.punchOut ? (
              <button onClick={handlePunchOut} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-md bg-red-700 py-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
                <LogOut size={18} /> {busy ? 'Punching out…' : 'Punch Out'}
              </button>
            ) : (
              <p className="text-sm text-green-700 dark:text-green-400">You've completed your attendance for today.</p>
            )}
          </div>
        )}

        {teacherId && (
          <div className="mt-4">
            {correctionMsg && <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">{correctionMsg}</p>}
            {!showCorrection ? (
              <button onClick={() => setShowCorrection(true)} className="text-xs font-medium text-primary-600 hover:underline">
                Request a correction to today's punch
              </button>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                <p className="mb-2 text-xs font-semibold text-primary-900 dark:text-gray-50">Request a correction</p>
                <div className="mb-2 flex gap-2">
                  <input type="time" className="input flex-1" value={correctionPunchIn} onChange={(e) => setCorrectionPunchIn(e.target.value)} placeholder="Punch in" />
                  <input type="time" className="input flex-1" value={correctionPunchOut} onChange={(e) => setCorrectionPunchOut(e.target.value)} placeholder="Punch out" />
                </div>
                <textarea className="input mb-2 w-full" rows={2} placeholder="Reason" value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={handleSubmitCorrection} disabled={!correctionReason.trim()} className="btn-primary flex-1">
                    Submit
                  </button>
                  <button onClick={() => setShowCorrection(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
