// electron/main.cjs
//
// This is the Electron "main process" — the part that creates the actual
// window and gives AURAED SCHOOL its own icon, taskbar entry, and desktop
// shortcut instead of living inside a browser tab.
//
// It does NOT change how the app works: once the window opens, it's still
// loading the same web app and still talking to Supabase over the
// internet exactly like it does in Chrome today. This file only controls
// the window itself.
//
// Important: we serve the built app through a custom "app://" protocol
// instead of raw file://. Chromium places real restrictions on ES module
// scripts (which is what Vite outputs) loaded via file:// — this can
// produce exactly a blank white window with no visible console error,
// since the script technically "loads" (200 OK) but Chromium's module
// loader silently refuses to execute it under a file: origin in some
// configurations. A custom protocol avoids this entirely and is the
// standard, production-grade fix for Electron + Vite apps.

const { app, BrowserWindow, shell, protocol, net, session } = require('electron');
const path = require('node:path');
const url = require('node:url');

const DEV_SERVER_URL = process.env.ELECTRON_DEV_SERVER_URL;
const DIST_DIR = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'AURAED SCHOOL',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: '#F6F4EF',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);

  if (DEV_SERVER_URL) {
    win.loadURL(DEV_SERVER_URL);
  } else {
    win.loadURL('app://bundle/index.html');
  }

  // Anything that would normally open a new browser tab (e.g. a target="_blank"
  // link) opens in the person's real default browser instead of a second
  // Electron window — keeps the desktop app itself single-window and simple.
  win.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  // The app uses client-side routing (e.g. /school/students) that only
  // exists as a real file for the root page. If the person presses Ctrl+R
  // while deep in the app, catch the failed reload and go back to the root
  // instead of showing a broken page.
  win.webContents.on('did-fail-load', (_event, errorCode) => {
    if (!DEV_SERVER_URL && errorCode !== -3) {
      win.loadURL('app://bundle/index.html');
    }
  });
}

app.whenReady().then(() => {
  // Electron denies permission requests (geolocation included) by default
  // unless the app explicitly allows them here. Without this, Punch
  // In/Out's location request silently fails, coordinates come back
  // null, and the server-side geofence check correctly (but confusingly)
  // rejects the punch for "missing location" — this is what actually
  // fixes that, not a change to the geofencing logic itself.
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'geolocation');
  });

  if (!DEV_SERVER_URL) {
    // Serve the built dist/ folder under app://bundle/... — any path that
    // doesn't match a real file (client-side routes like /school/students)
    // falls back to index.html, same idea as a web host's SPA rewrite rule.
    protocol.handle('app', (request) => {
      const requestUrl = new URL(request.url);
      let filePath = path.normalize(path.join(DIST_DIR, requestUrl.pathname));

      if (!filePath.startsWith(DIST_DIR)) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const fs = require('node:fs');
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      return net.fetch(url.pathToFileURL(filePath).toString());
    });
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
