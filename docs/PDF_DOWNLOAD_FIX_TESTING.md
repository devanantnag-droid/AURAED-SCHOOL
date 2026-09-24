# PDF Download Fix — Testing checklist

## What was actually wrong

Every "Download PDF" button (Report Cards, Certificates, ID Cards,
Payslips, Fee Receipts) used `PDFDownloadLink` from the PDF library,
which works by creating a `blob:` URL and simulating a click on a
hidden download link — completely standard and reliable in a real
browser, but Android's WebView (which the packaged Android app runs
inside) doesn't support triggering a file save that way. The button
either did nothing, or opened the PDF without any way to actually save
it.

## What's fixed

Built one shared component (`SavePdfButton`) that generates the exact
same PDF, but then branches by platform:
- **Web and desktop**: behaves exactly as before — a normal browser
  download, unchanged.
- **Android**: writes the PDF to the app's storage and opens Android's
  native **share sheet** — so the person can save it to Downloads,
  send it via WhatsApp, email it, or anything else the share sheet
  offers. This needed two new Capacitor plugins (Filesystem, Share).

Replaced all five PDFDownloadLink usages across Report Cards,
Certificates, ID Cards, Payslips, and Fee Receipts with this one
shared component, so this can't drift out of sync between them again.

## A near-miss worth mentioning

While editing Certificates.tsx (which has two separate PDF downloads
in it), a find-and-replace briefly deleted two closing tags that
happened to sit right after the block I was replacing. Caught it
immediately with a structural check (comparing function-declaration
counts to closing-brace counts) before moving on, and verified all
four edited files the same way afterward. Nothing shipped broken, but
worth being upfront that it happened.

## To apply

This adds two new dependencies:
```powershell
npm install
npm run android:sync
npm run android:open
```
Rebuild the APK as always. No new migration needed — this is a
code-only fix.

## Testing

### Web/Desktop (regression check)
Download a report card, a certificate, an ID card, a payslip, and a
fee receipt — confirm all five still download exactly as before.
Nothing should look or feel different here.

### Android
Same five, one at a time:
1. Tap the download/PDF button.
2. Confirm Android's native share sheet opens (not nothing, not an
   error).
3. Choose "Save to Files" (or your device's equivalent) — confirm the
   PDF actually saves and opens correctly afterward.
4. Try sharing one directly to WhatsApp or email as a second check —
   confirm the attached file is a real, valid PDF.

### Failure case
If PDF generation itself fails for any reason, confirm you see a
clear error message under the button rather than the button silently
doing nothing.
