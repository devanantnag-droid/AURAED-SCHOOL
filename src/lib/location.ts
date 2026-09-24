import { Geolocation } from '@capacitor/geolocation';
import { isNativeApp } from '@/lib/platform';

export interface SimpleLocation {
  latitude: number | null;
  longitude: number | null;
}

// Raw navigator.geolocation works fine in a normal browser, but neither
// the Android app nor the Electron desktop app grant that automatically —
// each has its own native permission model. Inside the Android app, the
// Capacitor Geolocation plugin handles Android's runtime permission
// prompt properly; everywhere else, the browser API (now that Electron's
// main process explicitly allows it) is what actually works.
export async function getCurrentLocation(): Promise<SimpleLocation> {
  if (isNativeApp()) {
    try {
      const status = await Geolocation.checkPermissions();
      if (status.location !== 'granted' && status.coarseLocation !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        if (requested.location !== 'granted' && requested.coarseLocation !== 'granted') {
          return { latitude: null, longitude: null };
        }
      }
      const position = await Geolocation.getCurrentPosition({ timeout: 20000, maximumAge: 30000 });
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch {
      return { latitude: null, longitude: null };
    }
  }

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve({ latitude: null, longitude: null }),
      { timeout: 20000, maximumAge: 30000 }
    );
  });
}
