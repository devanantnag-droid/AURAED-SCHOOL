-- AURAED SCHOOL — Phase 44: Audit Log and Tickets feature gates
-- Run after 0001-0063.
--
-- Found via a systematic check of every sidebar page against whether it
-- has a FeatureGate at all - these two were the only remaining gaps
-- (Academics/Circulars/Grievances/Surveys/Exam Seating were already
-- fixed in 0058). Both are now toggleable per plan like everything else.

insert into public.features (code, name, description) values
  ('audit_log', 'Audit Log', 'History of changes made within the school'),
  ('tickets', 'Support Tickets', 'Raising and tracking support tickets with the platform')
on conflict (code) do nothing;
