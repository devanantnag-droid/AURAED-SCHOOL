import { useEffect, useState } from 'react';
import { Trash2, Armchair } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { FeatureGate } from '@/components/layout/FeatureGate';
import { PermissionGate } from '@/components/layout/PermissionGate';
import { getErrorMessage } from '@/lib/errors';
import { listExams } from '@/services/exams.service';
import type { Exam } from '@/types/exams';
import {
  listExamRooms,
  createExamRoom,
  deleteExamRoom,
  generateSeating,
  listSeatingForExam,
} from '@/services/examSeating.service';
import type { ExamRoom, SeatAssignment } from '@/services/examSeating.service';
import { PageHeader } from '@/components/shared/PageHeader';

export function ExamSeatingPage() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [seating, setSeating] = useState<SeatAssignment[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('');

  async function loadBase() {
    if (!profile?.schoolId) return;
    try {
      const [e, r] = await Promise.all([listExams(profile.schoolId), listExamRooms(profile.schoolId)]);
      setExams(e);
      setRooms(r);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to load exams and rooms.'));
    }
  }

  useEffect(() => {
    loadBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.schoolId]);

  useEffect(() => {
    if (!selectedExamId) {
      setSeating([]);
      return;
    }
    listSeatingForExam(selectedExamId)
      .then(setSeating)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load seating.')));
  }, [selectedExamId]);

  async function handleAddRoom() {
    if (!profile?.schoolId || !newRoomName.trim() || !newRoomCapacity) return;
    try {
      await createExamRoom(profile.schoolId, newRoomName, Number(newRoomCapacity));
      setNewRoomName('');
      setNewRoomCapacity('');
      loadBase();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to add room.'));
    }
  }

  async function handleDeleteRoom(id: string) {
    try {
      await deleteExamRoom(id);
      loadBase();
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to delete room.'));
    }
  }

  function toggleRoom(id: string) {
    setSelectedRoomIds((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  }

  async function handleGenerate() {
    if (!profile?.schoolId || !selectedExamId) return;
    setGenerating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const result = await generateSeating(profile.schoolId, selectedExamId, selectedRoomIds);
      setSeating(await listSeatingForExam(selectedExamId));
      setSuccessMsg(
        result.unseated > 0
          ? `Seated ${result.seated} students. ${result.unseated} couldn't be seated — add more room capacity and generate again.`
          : `Seated all ${result.seated} students.`
      );
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to generate seating.'));
    } finally {
      setGenerating(false);
    }
  }

  const seatingByRoom = new Map<string, SeatAssignment[]>();
  seating.forEach((s) => {
    const list = seatingByRoom.get(s.roomName) ?? [];
    list.push(s);
    seatingByRoom.set(s.roomName, list);
  });

  return (
    <FeatureGate feature="exam_seating">
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader title="Exam Seating" subtitle="Generates a seating plan mixing students from different classes, so no two students from the same class sit next to each other." />
      {errorMsg && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {successMsg && <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{successMsg}</p>}

      <PermissionGate code="exam_seating.manage">
        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Rooms</h2>
          <ul className="mb-3 space-y-1.5">
            {rooms.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span>{r.name} · {r.capacity} seats</span>
                <button onClick={() => handleDeleteRoom(r.id)} className="text-red-600 hover:underline">
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
            {rooms.length === 0 && <p className="text-sm text-gray-500">No rooms added yet.</p>}
          </ul>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Room name" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
            <input type="number" className="input w-28" placeholder="Capacity" value={newRoomCapacity} onChange={(e) => setNewRoomCapacity(e.target.value)} />
            <button onClick={handleAddRoom} className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
              Add
            </button>
          </div>
        </section>

        <section className="mb-6 rounded-md border border-gray-200 p-4 dark:border-gray-800">
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-50">Generate seating</h2>
          <select className="input mb-3 w-full" value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}>
            <option value="">Select exam…</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Use these rooms</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => toggleRoom(r.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedRoomIds.includes(r.id) ? 'bg-primary-700 text-white' : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                }`}
              >
                {r.name} ({r.capacity})
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating || !selectedExamId || selectedRoomIds.length === 0}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {generating ? 'Generating…' : 'Generate seating'}
          </button>
        </section>
      </PermissionGate>

      {selectedExamId && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-50">Seating chart</h2>
          {seatingByRoom.size === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-gray-400">
              <Armchair size={28} />
              <p className="text-sm">No seating generated yet for this exam.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(seatingByRoom.entries()).map(([roomName, seats]) => (
                <div key={roomName} className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                  <p className="mb-2 text-sm font-semibold text-primary-900 dark:text-gray-50">{roomName}</p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {seats.map((s) => (
                      <div key={s.id} className="rounded-md bg-gray-50 p-2 text-xs dark:bg-gray-900">
                        <span className="font-medium text-gray-500">Seat {s.seatNumber}</span> · {s.studentName}
                        <span className="block text-gray-500">{s.className} - {s.sectionName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
    </FeatureGate>
  );
}
