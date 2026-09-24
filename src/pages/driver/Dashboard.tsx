import { useEffect, useRef, useState } from 'react';
import { LogOut, Navigation, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/errors';
import { getCurrentLocation } from '@/lib/location';
import { getMyVehicle, updateMyVehicleLocation } from '@/services/vehicleTracking.service';
import { SchoolLogo } from '@/components/shared/SchoolLogo';

const UPDATE_INTERVAL_MS = 15000;

export function DriverDashboard() {
  const { profile, signOut } = useAuth();
  const [vehicle, setVehicle] = useState<{ id: string; vehicleNumber: string } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    getMyVehicle()
      .then(setVehicle)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load your vehicle.')))
      .finally(() => setLoading(false));
  }, []);

  async function pushLocation() {
    if (!profile?.schoolId || !vehicle) return;
    try {
      const loc = await getCurrentLocation();
      if (loc.latitude == null || loc.longitude == null) {
        setErrorMsg('Couldn\u2019t get your location. Check that location is turned on and this app has permission.');
        return;
      }
      await updateMyVehicleLocation(profile.schoolId, vehicle.id, loc.latitude, loc.longitude);
      setLastUpdated(new Date());
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to update location.'));
    }
  }

  function startSharing() {
    setSharing(true);
    pushLocation();
    intervalRef.current = setInterval(pushLocation, UPDATE_INTERVAL_MS);
  }

  function stopSharing() {
    setSharing(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-paper dark:bg-paper-dark">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <SchoolLogo className="h-8 w-8 rounded-md object-contain" />
          <div>
            <p className="font-serif text-sm font-semibold text-primary-800 dark:text-gray-50">AURAED SCHOOL</p>
            <p className="text-xs text-gray-500">Driver</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="flex items-center gap-1 text-xs text-gray-500">
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : !vehicle ? (
          <p className="text-sm text-gray-500">Your account isn't linked to a vehicle yet — ask your School Admin.</p>
        ) : (
          <>
            <p className="mb-1 text-lg font-semibold text-primary-900 dark:text-gray-50">{vehicle.vehicleNumber}</p>
            <p className="mb-6 text-sm text-gray-500">
              {sharing ? `Sharing location \u2014 updated ${lastUpdated ? lastUpdated.toLocaleTimeString() : 'just now'}` : 'Not sharing location'}
            </p>

            {errorMsg && <p className="mb-4 max-w-xs rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}

            {!sharing ? (
              <button onClick={startSharing} className="flex items-center gap-2 rounded-full bg-green-700 px-8 py-4 text-base font-semibold text-white hover:bg-green-800">
                <Navigation size={20} /> Start sharing
              </button>
            ) : (
              <button onClick={stopSharing} className="flex items-center gap-2 rounded-full bg-red-700 px-8 py-4 text-base font-semibold text-white hover:bg-red-800">
                <MapPin size={20} /> Stop sharing
              </button>
            )}

            <p className="mt-6 max-w-xs text-xs text-gray-400">
              Keep this screen open while driving your route. Your location updates automatically every 15 seconds while sharing is on.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
