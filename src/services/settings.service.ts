import { supabase } from '@/lib/supabase';
import type { GeofenceSettings } from '@/types/punch';

export async function getGeofenceSettings(schoolId: string): Promise<GeofenceSettings> {
  const { data, error } = await supabase
    .from('school_settings')
    .select('geofence_enabled, geofence_latitude, geofence_longitude, geofence_radius_meters')
    .eq('school_id', schoolId)
    .maybeSingle();

  if (error) throw error;

  // Some schools (e.g. ones created before settings rows were auto-created,
  // or seeded directly via SQL) may not have a school_settings row yet.
  // Treat that as "geofencing off, nothing configured" rather than erroring.
  if (!data) {
    return { enabled: false, latitude: null, longitude: null, radiusMeters: 200 };
  }

  return {
    enabled: data.geofence_enabled,
    latitude: data.geofence_latitude,
    longitude: data.geofence_longitude,
    radiusMeters: data.geofence_radius_meters,
  };
}

export async function updateGeofenceSettings(schoolId: string, settings: GeofenceSettings): Promise<void> {
  const { error } = await supabase.from('school_settings').upsert(
    {
      school_id: schoolId,
      geofence_enabled: settings.enabled,
      geofence_latitude: settings.latitude,
      geofence_longitude: settings.longitude,
      geofence_radius_meters: settings.radiusMeters,
    },
    { onConflict: 'school_id' }
  );

  if (error) throw error;
}
