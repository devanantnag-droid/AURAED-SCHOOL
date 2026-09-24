import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listSessions as listAcademicSessions } from '@/services/academics.service';
import { listTeachers } from '@/services/teachers.service';
import { listStudents } from '@/services/students.service';
import {
  bookSlot,
  cancelBooking,
  createSession,
  createSlot,
  listBookings,
  listSessions,
  listSlots,
} from '@/services/ptm.service';
import type { PtmBooking, PtmSession, PtmSlot } from '@/types/ptm';
import type { AcademicSession } from '@/types/academics';
import type { Student, Teacher } from '@/types/people';
import { PageHeader } from '@/components/shared/PageHeader';

function SessionsSlotsTab() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<PtmSession[]>([]);
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [slots, setSlots] = useState<PtmSlot[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [ptmDate, setPtmDate] = useState('');

  const [slotTeacherId, setSlotTeacherId] = useState('');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');

  async function loadSessions() {
    if (!profile?.schoolId) return;
    const s = await listSessions(profile.schoolId);
    setSessions(s);
    if (s.length > 0 && !selectedSessionId) setSelectedSessionId(s[0].id);
  }

  useEffect(() => {
    if (!profile?.schoolId) return;
    loadSessions();
    listAcademicSessions(profile.schoolId).then(setAcademicSessions);
    listTeachers(profile.schoolId).then((t) => setTeachers(t.filter((x) => x.status === 'active')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !selectedSessionId) return;
    listSlots(profile.schoolId, selectedSessionId).then(setSlots);
  }, [profile?.schoolId, selectedSessionId]);

  async function handleCreateSession() {
    if (!profile?.schoolId || !title.trim() || !ptmDate) return;
    setErrorMsg(null);
    try {
      const current = academicSessions.find((s) => s.isCurrent) ?? academicSessions[0];
      await createSession(profile.schoolId, current?.id, title, ptmDate);
      setTitle('');
      setPtmDate('');
      loadSessions();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to create PTM session.'));
    }
  }

  async function handleAddSlot() {
    if (!profile?.schoolId || !selectedSessionId || !slotTeacherId || !slotStart || !slotEnd) return;
    setErrorMsg(null);
    try {
      await createSlot({ schoolId: profile.schoolId, ptmSessionId: selectedSessionId, teacherId: slotTeacherId, startTime: slotStart, endTime: slotEnd });
      setSlotStart('');
      setSlotEnd('');
      setSlots(await listSlots(profile.schoolId, selectedSessionId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add slot.'));
    }
  }

  return (
    <div>
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

      <PermissionGate code="ptm.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">New PTM day</h2>
          <div className="flex flex-wrap gap-2">
            <input className="input" placeholder="Title, e.g. Term 1 PTM" value={title} onChange={(e) => setTitle(e.target.value)} />
            <input type="date" className="input" value={ptmDate} onChange={(e) => setPtmDate(e.target.value)} />
            <button onClick={handleCreateSession} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Create
            </button>
          </div>
        </section>
      </PermissionGate>

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No PTM days set up yet.</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium text-gray-500">PTM day</label>
            <select className="input max-w-sm" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.title} — {s.ptmDate}</option>)}
            </select>
          </div>

          <PermissionGate code="ptm.manage">
            <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
              <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Add slot</h2>
              <div className="mb-3 flex flex-wrap gap-2">
                <select className="input" value={slotTeacherId} onChange={(e) => setSlotTeacherId(e.target.value)}>
                  <option value="">Teacher…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
                <input type="time" className="input" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                <input type="time" className="input" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                <button onClick={handleAddSlot} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                  Add slot
                </button>
              </div>
            </section>
          </PermissionGate>

          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Slots</h2>
          {slots.length === 0 ? (
            <p className="text-sm text-gray-500">No slots yet for this PTM day.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
              {slots.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-3 py-2">
                  <span>{s.teacherName} · {s.startTime} – {s.endTime}</span>
                  <span className={`text-xs ${s.isBooked ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
                    {s.isBooked ? 'Booked' : 'Available'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function BookingsTab() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<PtmSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [slots, setSlots] = useState<PtmSlot[]>([]);
  const [bookings, setBookings] = useState<PtmBooking[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [slotId, setSlotId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');

  async function loadAll() {
    if (!profile?.schoolId) return;
    const [s, b, st] = await Promise.all([listSessions(profile.schoolId), listBookings(profile.schoolId), listStudents(profile.schoolId)]);
    setSessions(s);
    setBookings(b);
    setStudents(st.filter((x) => x.status === 'active'));
    if (s.length > 0 && !selectedSessionId) setSelectedSessionId(s[0].id);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!profile?.schoolId || !selectedSessionId) return;
    listSlots(profile.schoolId, selectedSessionId).then(setSlots);
  }, [profile?.schoolId, selectedSessionId]);

  async function handleBook() {
    if (!profile?.schoolId || !slotId || !studentId || !parentName.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await bookSlot({ schoolId: profile.schoolId, ptmSlotId: slotId, studentId, parentName, parentPhone });
      setSuccessMsg('Slot booked.');
      setSlotId('');
      setParentName('');
      setParentPhone('');
      loadAll();
      if (selectedSessionId) setSlots(await listSlots(profile.schoolId, selectedSessionId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to book slot — it may already be taken.'));
    }
  }

  async function handleCancel(id: string) {
    setErrorMsg(null);
    try {
      await cancelBooking(id);
      loadAll();
      if (profile?.schoolId && selectedSessionId) setSlots(await listSlots(profile.schoolId, selectedSessionId));
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to cancel booking.'));
    }
  }

  const availableSlots = slots.filter((s) => !s.isBooked);

  return (
    <div>
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {successMsg && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>}

      <PermissionGate code="ptm.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Book a slot</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            <select className="input" value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)}>
              {sessions.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <select className="input" value={slotId} onChange={(e) => setSlotId(e.target.value)}>
              <option value="">Available slot…</option>
              {availableSlots.map((s) => <option key={s.id} value={s.id}>{s.teacherName} · {s.startTime}–{s.endTime}</option>)}
            </select>
            <select className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <input className="input" placeholder="Parent name" value={parentName} onChange={(e) => setParentName(e.target.value)} />
            <input className="input" placeholder="Parent phone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
          </div>
          <button onClick={handleBook} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
            Book slot
          </button>
        </section>
      </PermissionGate>

      <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">All bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-gray-500">No bookings yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200 text-sm dark:divide-gray-800 dark:border-gray-800">
          {bookings.map((b) => (
            <li key={b.id} className="flex items-center justify-between px-3 py-2">
              <span>
                {b.studentName} with {b.teacherName} ({b.startTime}–{b.endTime}) · {b.parentName} {b.parentPhone && `· ${b.parentPhone}`}
              </span>
              <PermissionGate code="ptm.manage">
                <button onClick={() => handleCancel(b.id)} className="text-xs text-red-600 hover:underline">
                  Cancel
                </button>
              </PermissionGate>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PtmInner() {
  const [tab, setTab] = useState<'setup' | 'bookings'>('setup');

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="PTM Scheduling" />
      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['setup', 'bookings'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t === 'setup' ? 'Sessions & Slots' : 'Bookings'}
          </button>
        ))}
      </div>

      {tab === 'setup' ? <SessionsSlotsTab /> : <BookingsTab />}
    </div>
  );
}

export function PtmPage() {
  return (
    <FeatureGate feature="ptm">
      <PtmInner />
    </FeatureGate>
  );
}
