import { useEffect, useState } from 'react';
import { Bus, ExternalLink } from 'lucide-react';
import { getErrorMessage } from '@/lib/errors';
import { getMyChildVehicleLocation, googleMapsLink } from '@/services/vehicleTracking.service';

type Result = { vehicleNumber: string; location: { latitude: number; longitude: number; updatedAt: string } | null } | 'no_assignment' | 'no_vehicle';

function minutesAgo(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
}

const REFRESH_INTERVAL_MS = 15000;

export function MyBusLocation({ studentId }: { studentId: string }) {
  const [result, setResult] = useState<Result | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load() {
      getMyChildVehicleLocation(studentId)
        .then((r) => {
          if (!cancelled) setResult(r);
        })
        .catch((err) => {
          if (!cancelled) setErrorMsg(getErrorMessage(err, 'Failed to load bus location.'));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [studentId]);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (errorMsg) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>;

  if (result === 'no_assignment') {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-gray-400">
        <Bus size={28} />
        <p className="text-sm">No transport assignment on file</p>
      </div>
    );
  }

  if (result === 'no_vehicle') {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-gray-400">
        <Bus size={28} />
        <p className="text-sm">Assigned to a route, but no vehicle has been added to it yet — check with your School Admin.</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="rounded-md border border-gray-200 p-4 dark:border-gray-800">
      <p className="mb-1 font-medium text-gray-900 dark:text-gray-50">{result.vehicleNumber}</p>
      {result.location ? (
        <>
          <p className="mb-3 text-xs text-gray-500">
            Last updated {minutesAgo(result.location.updatedAt) <= 0 ? 'just now' : `${minutesAgo(result.location.updatedAt)} min ago`}
          </p>
          <a
            href={googleMapsLink(result.location.latitude, result.location.longitude)}
            target="_blank"
            rel="noreferrer"
            className="flex w-fit items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            <ExternalLink size={14} /> Open in Maps
          </a>
        </>
      ) : (
        <p className="text-sm text-gray-500">The driver hasn't started sharing location yet today.</p>
      )}
    </div>
  );
}
