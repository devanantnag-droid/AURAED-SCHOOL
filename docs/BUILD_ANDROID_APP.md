# Building the Auraed School Android app

This wraps the same web app in a real Android app — its own icon on the
home screen, its own app name ("Auraed School"), and an installable
`.apk` file, using the same underlying approach as the Windows desktop
app: the existing app, inside a native shell.

**Same important note as the desktop app: this does not work offline.**
It still needs an internet connection to talk to your Supabase project,
exactly like the browser and desktop versions. This only changes how the
app is opened and installed on a phone.

## What's already done for you

- `capacitor.config.ts` — app ID (`com.auraedschool.app`) and app name
  ("Auraed School") are already set.
- `package.json` has three new scripts: `android:add`, `android:sync`,
  `android:open`.
- A full set of app icons, already generated in the same navy-and-brass
  style as the desktop app, sitting in `android-icons-to-install/` ready
  to drop into the native project once it exists (step 4 below).

## What you'll need to install (the big one-time step)

Unlike the desktop build, this needs **Android Studio** — a large
(multi-GB) free IDE from Google that includes everything needed to build
Android apps.

1. Download and install Android Studio: **https://developer.android.com/studio**
2. Run it once after installing — it'll prompt you through installing the
   Android SDK components it needs. Accept the defaults.
3. This step can take a while (it's a big download) — a good one to start
   and let run in the background.

## Step 1: Install the new dependencies

```powershell
cd C:\Users\user\Desktop\auraed-school-phase1\auraed-school
npm install
```

## Step 2: Build the web app

```powershell
npm run build
```

## Step 3: Generate the native Android project

This is the one step that needs internet access on your machine — it
downloads Capacitor's Android template:

```powershell
npm run android:add
```

This creates a new `android/` folder in your project — a full native
Android Studio project. You only need to do this once; after this, the
`android/` folder is a permanent part of your project.

## Step 4: Install the app icon

Copy the icon files into the newly created project, overwriting Android's
placeholder icons:

```powershell
Copy-Item -Recurse -Force .\android-icons-to-install\* .\android\app\src\main\res\
```

## Step 5: Sync the built app into the Android project

Every time you make changes to the app itself (through this chat, as
always) and want to rebuild the Android app, run:

```powershell
npm run android:sync
```

This rebuilds the web app and copies it into the native Android project.
**Run this now** for the first time.

## Step 6: Open it in Android Studio

```powershell
npm run android:open
```

This launches Android Studio with the project already open. The first
open can take a few minutes while it indexes everything — let it finish.

## Step 7: Build the actual `.apk`

Once Android Studio is done loading:

1. In the top menu: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**
2. Wait for it to finish (a notification appears bottom-right when done)
3. Click **locate** in that notification, or find it yourself at:
   `android\app\build\outputs\apk\debug\app-debug.apk`

**That file is your installable Android app.**

## Installing it on a phone

The simplest way: copy `app-debug.apk` to your phone (via USB cable,
email it to yourself, Google Drive, whatever's easiest), open it on the
phone, and tap to install. Android will likely warn about installing from
an unknown source the first time — this is normal for an app not from the
Play Store; allow it.

Alternatively, with a phone connected via USB and **USB debugging** turned
on (Settings → About phone → tap "Build number" 7 times to unlock
Developer options → turn on USB debugging), you can click the green
**Run** (▶) button directly in Android Studio to install and launch it on
your connected phone in one step.

## A couple of things worth knowing

- **This debug APK is fine for your own testing and sharing directly**,
  but it's not signed for the Play Store. Publishing to the Play Store is
  a separate, more involved process (needs a signing key, a Google Play
  Developer account which costs a one-time $25 fee, and a review process)
  — a good next step if you want this properly distributed, but a
  distinct task from just having a working Android app.
- **Updating it later**: repeat Steps 5–7 (`android:sync`, open Android
  Studio, rebuild the APK) whenever the app changes and you want a new
  version. The icon only needs reinstalling (Step 4) if you ever change
  it — it stays in place otherwise.
- **Every login/permission/security rule from the whole build still
  applies exactly the same** — this is genuinely the same app, just in
  a different shell.
