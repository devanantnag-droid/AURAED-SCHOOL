# School Logo — Dashboards + PDFs — Testing checklist

## Dashboards (School, Teacher, Student, Parent, Driver)

Every dashboard header now shows the school's own uploaded logo instead
of either plain text or the platform's default mark. Super Admin
intentionally keeps the platform logo, since they're not scoped to one
school.

### To test
1. Go to **School Settings → Branding & Profile** and upload a logo (if
   you haven't already).
2. Check each role's dashboard/header:
   - School Admin sidebar
   - Teacher, Student, Parent portal header
   - Driver dashboard header
   - The mobile app's home screen header
3. Confirm the uploaded logo shows in all of them.
4. As a sanity check: log in as **Super Admin** and confirm they still
   show the platform's own logo, not any particular school's.
5. Test the fallback: temporarily clear a test school's logo (or use a
   school that never uploaded one) — confirm the platform's default
   mark shows cleanly instead of a broken image icon.

## PDF documents

All 4 PDF documents now embed the school's logo at the top:
- **Report Card**
- **Payslip**
- **Fee Receipt**
- **Certificates** and **ID Cards** (the ID card gets a small version,
  sized carefully for its tight 260×160 card format)

### To test
Generate one of each and open the resulting PDF:
1. Report Card (Exams → Report Cards)
2. Payslip (Payroll)
3. Fee Receipt (a student's Fees Summary)
4. A Certificate (Certificates & ID Cards)
5. An ID Card (same page, ID Cards tab)

Confirm the logo appears correctly positioned in each, and doesn't look
stretched, cut off, or oversized — especially on the ID card given its
small size.

### If a school hasn't uploaded a logo
The PDFs simply don't show a logo in that case (no broken image, no
platform logo substituted) — a school's official documents shouldn't
carry the platform's own branding by default. If you'd rather have a
fallback appear there too, let me know and I can add that.
