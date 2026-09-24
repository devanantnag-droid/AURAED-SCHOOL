-- AURAED SCHOOL — Phase 12: RLS for books/book_issues
-- Run after 0023_library.sql.

alter table public.books enable row level security;
alter table public.book_issues enable row level security;

-- =========================================================================
-- BOOKS
-- =========================================================================
create policy books_select on public.books
  for select using (public.user_has_role('SUPER_ADMIN') or (school_id = public.user_school_id() and public.user_has_permission('library.view')));
create policy books_write on public.books
  for all using (school_id = public.user_school_id() and public.user_has_permission('library.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('library.manage'));
create policy books_super_admin on public.books
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));

-- =========================================================================
-- BOOK ISSUES — librarian/admin see and manage everything; a teacher can
-- also see their own borrowing history (student self-view isn't wired up
-- yet, same limitation noted for attendance/payroll — no student portal
-- login exists).
-- =========================================================================
create policy book_issues_select on public.book_issues
  for select using (
    public.user_has_role('SUPER_ADMIN')
    or (school_id = public.user_school_id() and public.user_has_permission('library.view'))
    or teacher_id = public.current_teacher_id()
  );
create policy book_issues_write on public.book_issues
  for all using (school_id = public.user_school_id() and public.user_has_permission('library.manage'))
  with check (school_id = public.user_school_id() and public.user_has_permission('library.manage'));
create policy book_issues_super_admin on public.book_issues
  for all using (public.user_has_role('SUPER_ADMIN')) with check (public.user_has_role('SUPER_ADMIN'));
