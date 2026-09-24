import { Capacitor } from '@capacitor/core';

// True only when running inside the actual Android app (Capacitor's
// native wrapper) — false in every browser context, including the
// desktop Electron app and the plain web version. This is what lets the
// same codebase show the desktop sidebar everywhere else, but a real
// mobile-first shell (bottom nav, icon grid) only inside the Android app.
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
