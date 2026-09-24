# Building the AURAED SCHOOL desktop app (.exe)

This turns AURAED SCHOOL into a real Windows desktop app — its own icon,
its own window, a taskbar entry, and a proper installer with a desktop
shortcut, instead of living inside a browser tab.

**Important: this does not make the app work offline.** The desktop app
still connects to your Supabase project over the internet exactly like it
does in the browser today — this only changes how you *open* it.

## What was added

- `electron/main.cjs` — the small program that creates the app's window
  and loads AURAED SCHOOL inside it. It serves the built app through a
  custom `app://` address rather than a raw file path — Chromium places
  real restrictions on the kind of JavaScript Vite outputs when loaded via
  a plain file path, which can cause a blank window with no visible error.
  A custom protocol avoids that entirely and is the standard approach used
  by production Electron + Vite apps.
- Two new scripts in `package.json`: `electron:dev` (for trying it out
  while developing) and `electron:build` (produces the actual installer).
- `electron` and `electron-builder` as new dev dependencies — the tools
  that do the actual packaging.

## One-time setup

Since building the installer needs an internet connection to download
these new tools, do this once:

```powershell
cd C:\Users\user\Desktop\auraed-school-phase1\auraed-school
npm install
```

This pulls in Electron and electron-builder alongside everything else.
It's a bigger download than usual (Electron itself is large) — give it a
few minutes.

## Try it without building an installer first (optional but recommended)

This lets you see the desktop window immediately, without waiting for a
full installer build:

**Terminal 1** — start the normal dev server:
```powershell
npm run dev
```

**Terminal 2** — open a second PowerShell window in the same folder, then:
```powershell
npm run electron:dev
```

A real desktop window should pop up showing AURAED SCHOOL, connected to
your Supabase project exactly like the browser version. Log in and click
around to confirm everything behaves the same. Close the window when
you're done — this doesn't create any installer, it's just a preview.

## Build the real installer (.exe)

```powershell
npm run electron:build
```

This does two things in order: builds the production version of the app
(same as your normal `npm run build`), then packages it into a Windows
installer. It'll take a few minutes the first time.

When it finishes, look in the new `release` folder:
```powershell
Get-ChildItem .\release\
```

You'll see a file like:
```
AURAED SCHOOL Setup 0.1.0.exe
```

**That's the installer.** Double-click it to install AURAED SCHOOL like any
other Windows program — it'll ask where to install (or just use the
default), create a desktop shortcut and Start Menu entry, and from then on
you open it the same way you'd open Word or Chrome.

## Sharing it with others

That one `.exe` file is everything — you can send it to anyone (a USB
drive, a shared drive, email if it's not too large) and they can run it
to install the app on their own Windows computer. They'll still need
their own internet connection for it to actually work, same as you do.

## A couple of things worth knowing

- **The app icon**: `build/icon.ico` now uses your actual AURAED SCHOOL
  brand logo (the graduation cap and open book mark), not a placeholder.
  Worth knowing: at true 16×16 size (used in a few spots like window
  title bars) the fine detail and text become hard to make out — that's
  a natural limit of any detailed illustrative logo at very small sizes,
  not something to fix, just something to expect there. At 32px and up
  it reads clearly. If you ever want to change it, replace `build/
  icon.ico` and `build/icon.png` with a new image and rebuild.
- **Updating it later**: whenever you make changes to the app itself
  (through this chat, as always), just run `npm run electron:build` again
  to produce a new installer. There's no auto-update mechanism set up —
  people would need to reinstall with the new `.exe` each time you want
  them to get an update. That's fine for how this has been built so far,
  but if you want automatic updates down the line, that's a bigger
  separate feature (electron-builder does support it, but it needs a
  place online to host the update files).
- **Every login/permission/security rule from the whole build still
  applies exactly the same** — the desktop app is just a different way to
  open the same app, not a different app.

## Troubleshooting: "Cannot create symbolic link" during the build

If `npm run electron:build` fails partway through with an error mentioning
`winCodeSign` and "Cannot create symbolic link: A required privilege is
not held by the client" — this is a well-known Windows permissions quirk,
nothing to do with the app itself. electron-builder tries to download a
code-signing tool even for an unsigned build, and extracting it needs a
Windows privilege ("create symbolic links") that a normal user account
doesn't have by default.

The build script already tells electron-builder to skip code-signing
discovery entirely, which avoids this in most cases. If it still happens,
either of these fixes it permanently:

- **Turn on Windows Developer Mode** (recommended): Settings → Privacy &
  security → For developers → turn on **Developer Mode**. This grants
  your regular account the "create symbolic links" privilege without
  needing to run as Administrator every time.
- **Or, just this once**: right-click PowerShell → **Run as
  administrator**, `cd` back into the project folder, and run
  `npm run electron:build` from there. Administrator accounts have this
  privilege by default.

Either way, once that's sorted, rerun `npm run electron:build` — it picks
up right where it left off (the Vite build and TypeScript check have
already succeeded, this step is purely about installer packaging).
