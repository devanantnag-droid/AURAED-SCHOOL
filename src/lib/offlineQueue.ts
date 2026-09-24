import { useEffect, useState } from 'react';

export interface QueuedAttendance {
  id: string;
  queuedAt: string;
  payload: {
    schoolId: string;
    className: string;
    sectionName: string | null;
    date: string;
    entries: { studentId: string; status: string }[];
  };
}

const STORAGE_KEY = 'auraed_offline_attendance_queue';
type Listener = () => void;
const listeners = new Set<Listener>();

function readQueue(): QueuedAttendance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAttendance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  listeners.forEach((l) => l());
}

export function enqueueAttendance(payload: QueuedAttendance['payload']): void {
  const queue = readQueue();
  queue.push({ id: crypto.randomUUID(), queuedAt: new Date().toISOString(), payload });
  writeQueue(queue);
}

export function getQueuedAttendance(): QueuedAttendance[] {
  return readQueue();
}

function removeFromQueue(id: string) {
  writeQueue(readQueue().filter((q) => q.id !== id));
}

// Attempts to flush every queued attendance save. Each item is only
// removed from the queue once its own save genuinely succeeds — a
// failure partway through leaves the remaining items queued rather than
// silently dropping them, which is exactly what the spec calls out:
// never give a false impression that data reached the server.
export async function flushAttendanceQueue(
  saveFn: (payload: QueuedAttendance['payload']) => Promise<void>
): Promise<{ synced: number; failed: number }> {
  const queue = readQueue();
  let synced = 0;
  let failed = 0;
  for (const item of queue) {
    try {
      await saveFn(item.payload);
      removeFromQueue(item.id);
      synced++;
    } catch {
      failed++;
    }
  }
  return { synced, failed };
}

export function useQueuedAttendanceCount(): number {
  const [count, setCount] = useState(() => readQueue().length);
  useEffect(() => {
    const update = () => setCount(readQueue().length);
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);
  return count;
}
