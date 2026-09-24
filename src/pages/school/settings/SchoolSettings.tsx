import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getGeofenceSettings, updateGeofenceSettings } from '@/services/settings.service';
import { getCurrentLocation } from '@/lib/location';
import { getSchool, updateSchool } from '@/services/schools.service';
import { supabase } from '@/lib/supabase';
import type { GeofenceSettings } from '@/types/punch';
import type { School } from '@/types/school';
import { useHasRole } from '@/hooks/usePermissions';
import { ROLES } from '@/types/roles';
import { getErrorMessage } from '@/lib/errors';
import { PageHeader } from '@/components/shared/PageHeader';

function BrandingTab({ isSchoolAdmin }: { isSchoolAdmin: boolean }) {
  const { profile } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.schoolId) return;
    getSchool(profile.schoolId)
      .then(setSchool)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load school profile.')))
      .finally(() => setLoading(false));
  }, [profile?.schoolId]);

  function updateField<K extends keyof School>(key: K, value: School[K]) {
    setSchool((s) => (s ? { ...s, [key]: value } : s));
  }

  async function handleLogoUpload(file: File) {
    if (!profile?.schoolId) return;
    setErrorMsg(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${profile.schoolId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage.from('branding').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('branding').getPublicUrl(path);
      // Cache-bust so the new logo shows immediately instead of a stale
      // cached version at the same URL.
      const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
      updateField('logoUrl', publicUrl);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to upload logo.'));
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!profile?.schoolId || !school) return;
    setSaving(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      await updateSchool(profile.schoolId, {
        name: school.name,
        email: school.email,
        phone: school.phone ?? undefined,
        registrationNumber: school.registrationNumber ?? undefined,
        address: school.address ?? undefined,
        city: school.city ?? undefined,
        state: school.state ?? undefined,
        country: school.country ?? undefined,
        postalCode: school.postalCode ?? undefined,
        principalName: school.principalName ?? undefined,
        website: school.website ?? undefined,
        description: school.description ?? undefined,
        logoUrl: school.logoUrl ?? undefined,
      });
      setSavedMsg('Profile saved.');
    } catch (err) {
      setErrorMsg(getErrorMessage(err, 'Failed to save profile.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (!school) return <p className="text-sm text-gray-500">Could not load school profile.</p>;

  if (!isSchoolAdmin) {
    return (
      <div className="rounded-md border border-gray-200 p-5 dark:border-gray-800">
        {school.logoUrl && <img src={school.logoUrl} alt={`${school.name} logo`} className="mb-4 h-16 w-16 rounded-md object-cover" />}
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{school.name}</p>
        <p className="text-sm text-gray-500">{school.email}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-md border border-gray-200 p-5 dark:border-gray-800">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Logo</label>
        <div className="flex items-center gap-3">
          {school.logoUrl && <img src={school.logoUrl} alt="School logo" className="h-14 w-14 rounded-md border border-gray-200 object-cover dark:border-gray-700" />}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
            className="text-sm"
          />
          {uploading && <span className="text-xs text-gray-500">Uploading…</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">School name</label>
          <input className="input" value={school.name} onChange={(e) => updateField('name', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Principal name</label>
          <input className="input" value={school.principalName ?? ''} onChange={(e) => updateField('principalName', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Email</label>
          <input className="input" value={school.email} onChange={(e) => updateField('email', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Phone</label>
          <input className="input" value={school.phone ?? ''} onChange={(e) => updateField('phone', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Website</label>
          <input className="input" value={school.website ?? ''} onChange={(e) => updateField('website', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Registration #</label>
          <input className="input" value={school.registrationNumber ?? ''} onChange={(e) => updateField('registrationNumber', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Address</label>
        <input className="input mb-2 w-full" value={school.address ?? ''} onChange={(e) => updateField('address', e.target.value)} />
        <div className="grid grid-cols-3 gap-2">
          <input className="input" placeholder="City" value={school.city ?? ''} onChange={(e) => updateField('city', e.target.value)} />
          <input className="input" placeholder="State" value={school.state ?? ''} onChange={(e) => updateField('state', e.target.value)} />
          <input className="input" placeholder="Postal code" value={school.postalCode ?? ''} onChange={(e) => updateField('postalCode', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
        <textarea className="input w-full" rows={3} value={school.description ?? ''} onChange={(e) => updateField('description', e.target.value)} />
      </div>

      {errorMsg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errorMsg}</p>}
      {savedMsg && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">{savedMsg}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </div>
  );
}

function GeofencingTab({ isSchoolAdmin }: { isSchoolAdmin: boolean }) {
  const { profile } = useAuth();
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
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!profile?.schoolId) return;
    getGeofenceSettings(profile.schoolId)
      .then(setSettings)
      .catch((err) => setErrorMsg(getErrorMessage(err, 'Failed to load settings.')))
      .finally(() => setLoading(false));
  }, [profile?.schoolId]);

  async function useCurrentLocation() {
    setLocating(true);
    setErrorMsg(null);
    setSavedMsg(null);
    try {
      const location = await getCurrentLocation();
      if (location.latitude == null || location.longitude == null) {
        setErrorMsg(
          'Couldn\u2019t get your current location. Make sure location is turned on and this app has permission to use it, then try again.'
        );
        return;
      }
      setSettings((s) => ({ ...s, latitude: location.latitude, longitude: location.longitude }));
      setSavedMsg('Location captured \u2014 remember to Save below to keep it.');
    } finally {
      setLocating(false);
    }
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

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  return isSchoolAdmin ? (
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

      <button onClick={useCurrentLocation} disabled={locating} className="text-sm text-primary-600 hover:underline disabled:opacity-60">
        {locating ? 'Getting your location\u2026' : 'Use my current location as the school\u2019s coordinates'}
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
  );
}

export function SchoolSettingsPage() {
  const isSchoolAdmin = useHasRole(ROLES.SCHOOL_ADMIN);
  const [tab, setTab] = useState<'branding' | 'geofencing'>('branding');

  return (
    <div className="mx-auto max-w-xl p-6">
      <PageHeader title="School Settings" subtitle="Manage your school's profile, branding, and attendance geofencing." />

      <div className="mb-5 flex gap-1 border-b border-gray-200 text-sm dark:border-gray-800">
        {(['branding', 'geofencing'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-3 py-2 ${tab === t ? 'border-primary-600 font-medium text-primary-700 dark:text-primary-400' : 'border-transparent text-gray-500'}`}
          >
            {t === 'branding' ? 'Branding & Profile' : 'Attendance Geofencing'}
          </button>
        ))}
      </div>

      {tab === 'branding' ? <BrandingTab isSchoolAdmin={isSchoolAdmin} /> : <GeofencingTab isSchoolAdmin={isSchoolAdmin} />}
    </div>
  );
}
