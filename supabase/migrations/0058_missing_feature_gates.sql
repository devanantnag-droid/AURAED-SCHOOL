-- AURAED SCHOOL — Phase 37: Missing feature-gate entries
-- Run after 0001-0057.
--
-- These five modules exist and work, but were built in later phases and
-- never added to the features table — meaning every school on every
-- plan has always had them regardless of what their plan says, unlike
-- every other module. Academics/Circulars/Grievances were identified
-- earlier as a known gap; Surveys and Exam Seating are new from this
-- session. Fixing all five together for consistency.

insert into public.features (code, name, description) values
  ('academics', 'Academics', 'Classes, subjects, and teacher-subject assignments'),
  ('circulars', 'Circulars', 'Formal numbered notices from School Admin'),
  ('grievances', 'Grievances', 'Parent/student complaints and follow-up'),
  ('surveys', 'Parent Surveys', 'Feedback surveys sent to parents'),
  ('exam_seating', 'Exam Seating', 'Seating arrangement generation for exams')
on conflict (code) do nothing;
