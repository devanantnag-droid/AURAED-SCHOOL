import type { CapacitorConfig } from '@capacitor/cli';

// Wraps the same web app used everywhere else (browser, desktop) inside a
// native Android shell. Like the desktop app, this does NOT make the app
// work offline — it still talks to the same Supabase project over the
// internet. This only changes how the app is opened and installed.
const config: CapacitorConfig = {
  appId: 'com.auraedschool.app',
  appName: 'Auraed School',
  webDir: 'dist',
};

export default config;
