import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getGeofenceSettings, updateGeofenceSettings } from '@/services/settings.service';
import type { GeofenceSettings } from '@/types/punch';
import { useHasRole } from '@/hooks/usePermissions';
import { ROLES } from '@/types/roles';
import { getErrorMessage } from '@/lib/errors';

export function SchoolSettingsPage() {
  const { profile } = useAuth();
  const isSchoolAdmin = useHasRole(ROLES.SCHOOL_ADMIN);
  const [settings, setSettings] = useState<GeofenceSettings>({
    enabled: false,
    latitude: null,
    longitude: null,
    radiusMeters: 200,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    getGeofenceSettings(profile.schoolId)
      .then(setSettings)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load settings.')))
      .finally(() => setLoading(false));
  }, [profile?.schoolId]);

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setSettings((s) => ({ ...s, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
    });
  }

  async function handleSave() {
    if (!profile?.schoolId) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      await updateGeofenceSettings(profile.schoolId, settings);
      setSavedMsg('Settings saved.');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-50">School Settings</h1>
      <p className="mb-6 text-sm text-gray-500">
        Teacher Punch In/Out geofencing. When enabled, teachers can only punch in/out from within the allowed
        radius.
      </p>

      {isSchoolAdmin ? (
        <div className="space-y-5 rounded-md border border-gray-200 p-5 dark:border-gray-800">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
            />
            Enable geofencing
          </label>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Latitude</label>
              <input
                type="number"
                step="any"
                className="input"
                value={settings.latitude ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, latitude: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Longitude</label>
              <input
                type="number"
                step="any"
                className="input"
                value={settings.longitude ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, longitude: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Radius (meters)</label>
              <input
                type="number"
                className="input"
                value={settings.radiusMeters ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, radiusMeters: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          </div>

          <button onClick={useCurrentLocation} className="text-sm text-primary-600 hover:underline">
            Use my current location as the school's coordinates
          </button>

          {errorMsg && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {errorMsg}
            </p>
          )}
          {savedMsg && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              {savedMsg}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-500">You don't have permission to change these settings.</p>
      )}
    </div>
  );
}
