# Reports — PDF and Excel export — Testing checklist

## What changed

Every report in **Reports & Export** (Students, Attendance, Fee
Collection, Exam Results, Payroll) now works as: **Generate** once,
then choose **CSV**, **Excel**, or **PDF** — all three built from the
exact same fetched data, no re-fetching per format.

- **Excel** is a genuine `.xlsx` workbook (via SheetJS), not a renamed
  CSV — opens correctly in actual Excel/Google Sheets with real
  spreadsheet formatting underneath.
- **PDF** uses a new shared table layout with the school's own logo at
  the top, matching every other PDF document in the app now.
- Both new formats reuse the exact same native-vs-web handling already
  proven in the existing PDF download button — on the Android app, this
  saves the file and opens the OS share sheet; on web/desktop, it
  downloads directly.

## To apply

New dependency, so:
```powershell
npm install
```
Then rebuild as usual. No database migration needed.

## To test

For each of the 5 report types:
1. Fill in any required filters (date range, exam, month/year)
2. Click **Generate**
3. Confirm all three buttons (CSV, Excel, PDF) appear
4. Download each and open it:
   - **CSV**: opens fine in any text editor or spreadsheet app (unchanged
     from before)
   - **Excel**: opens as a real spreadsheet, correct headers and rows
   - **PDF**: shows the school's logo, school name, report title, and a
     clean table of the data

Also confirm:
- Generating a **different** report doesn't clear a previously
  generated one — each report's buttons should stay available
  independently.
- An empty result (e.g., an attendance range with no records) shows the
  "No data found" message and no buttons, rather than empty files.

## Known scope note

This covers the desktop/web Reports page specifically. The Android
app's own mobile Reports screen still shows data in an in-app table
only — extending PDF/Excel there is a reasonable, contained follow-up
now that the underlying plugins are confirmed already installed, not
something I wanted to fold into this same change silently.
